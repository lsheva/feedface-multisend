import { describe, it } from "node:test";
import assert from "node:assert/strict";
import hre from "hardhat";

const { viem, networkHelpers } = await hre.network.connect();

const ETH_1 = 1_000_000_000_000_000_000n;

async function deployFixture() {
  const multiSend = await viem.deployContract("FeedFaceMultisend");
  const token = await viem.deployContract("MockERC20Permit", ["TestToken", "TT"]);
  const [deployer, alice, bob, charlie] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  return { multiSend, token, deployer, alice, bob, charlie, publicClient };
}

describe("MultiSend", () => {
  describe("ETH transfers", () => {
    it("sends ETH to multiple recipients", async () => {
      const { multiSend, deployer, alice, bob, publicClient } =
        await networkHelpers.loadFixture(deployFixture);

      const aliceBefore = await publicClient.getBalance({ address: alice.account.address });
      const bobBefore = await publicClient.getBalance({ address: bob.account.address });

      await multiSend.write.disperse(
        [
          deployer.account.address,
          [
            { to: alice.account.address, amount: ETH_1 },
            { to: bob.account.address, amount: ETH_1 * 2n },
          ],
          [],
          [],
        ],
        { value: ETH_1 * 3n },
      );

      const aliceAfter = await publicClient.getBalance({ address: alice.account.address });
      const bobAfter = await publicClient.getBalance({ address: bob.account.address });
      assert.equal(aliceAfter - aliceBefore, ETH_1);
      assert.equal(bobAfter - bobBefore, ETH_1 * 2n);
    });

    it("refunds excess ETH to msg.sender", async () => {
      const { multiSend, deployer, alice, publicClient } =
        await networkHelpers.loadFixture(deployFixture);

      const senderBefore = await publicClient.getBalance({ address: deployer.account.address });

      const hash = await multiSend.write.disperse(
        [
          deployer.account.address,
          [{ to: alice.account.address, amount: ETH_1 }],
          [],
          [],
        ],
        { value: ETH_1 * 5n },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;
      const senderAfter = await publicClient.getBalance({ address: deployer.account.address });

      assert.equal(senderBefore - senderAfter - gasUsed, ETH_1);
    });

    it("reverts when not enough ETH is sent", async () => {
      const { multiSend, deployer, alice } =
        await networkHelpers.loadFixture(deployFixture);

      await assert.rejects(
        multiSend.write.disperse(
          [
            deployer.account.address,
            [{ to: alice.account.address, amount: ETH_1 }],
            [],
            [],
          ],
          { value: ETH_1 / 2n },
        ),
      );
    });
  });

  describe("ERC20 transfers", () => {
    it("transfers tokens via transferFrom with sender param", async () => {
      const { multiSend, token, deployer, alice, bob, publicClient } =
        await networkHelpers.loadFixture(deployFixture);

      await token.write.mint([deployer.account.address, ETH_1 * 100n]);
      await token.write.approve([multiSend.address, ETH_1 * 100n]);

      await multiSend.write.disperse([
        deployer.account.address,
        [],
        [
          { token: token.address, to: alice.account.address, amount: ETH_1 * 30n },
          { token: token.address, to: bob.account.address, amount: ETH_1 * 20n },
        ],
        [],
      ]);

      const aliceBal = await token.read.balanceOf([alice.account.address]);
      const bobBal = await token.read.balanceOf([bob.account.address]);
      assert.equal(aliceBal, ETH_1 * 30n);
      assert.equal(bobBal, ETH_1 * 20n);
    });

    it("reverts when sender has no allowance", async () => {
      const { multiSend, token, deployer, alice } =
        await networkHelpers.loadFixture(deployFixture);

      await token.write.mint([deployer.account.address, ETH_1 * 100n]);

      await assert.rejects(
        multiSend.write.disperse([
          deployer.account.address,
          [],
          [{ token: token.address, to: alice.account.address, amount: ETH_1 }],
          [],
        ]),
      );
    });
  });

  describe("ERC20 with permit", () => {
    it("executes permit then transfers tokens without prior approval", async () => {
      const { multiSend, token, deployer, alice, publicClient } =
        await networkHelpers.loadFixture(deployFixture);

      await token.write.mint([deployer.account.address, ETH_1 * 100n]);

      const domain = {
        name: "TestToken",
        version: "1",
        chainId: await publicClient.getChainId(),
        verifyingContract: token.address,
      } as const;

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      } as const;

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const nonce = await token.read.nonces([deployer.account.address]);

      const signature = await deployer.signTypedData({
        domain,
        types,
        primaryType: "Permit",
        message: {
          owner: deployer.account.address,
          spender: multiSend.address,
          value: ETH_1 * 50n,
          nonce,
          deadline,
        },
      });

      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const v = parseInt(signature.slice(130, 132), 16);

      await multiSend.write.disperse([
        deployer.account.address,
        [],
        [{ token: token.address, to: alice.account.address, amount: ETH_1 * 50n }],
        [{ token: token.address, value: ETH_1 * 50n, deadline, v, r, s }],
      ]);

      const aliceBal = await token.read.balanceOf([alice.account.address]);
      assert.equal(aliceBal, ETH_1 * 50n);
    });
  });

  describe("mixed ETH + ERC20", () => {
    it("disperses ETH and tokens in a single call", async () => {
      const { multiSend, token, deployer, alice, bob, charlie, publicClient } =
        await networkHelpers.loadFixture(deployFixture);

      await token.write.mint([deployer.account.address, ETH_1 * 100n]);
      await token.write.approve([multiSend.address, ETH_1 * 100n]);

      const aliceEthBefore = await publicClient.getBalance({ address: alice.account.address });

      await multiSend.write.disperse(
        [
          deployer.account.address,
          [{ to: alice.account.address, amount: ETH_1 }],
          [
            { token: token.address, to: bob.account.address, amount: ETH_1 * 10n },
            { token: token.address, to: charlie.account.address, amount: ETH_1 * 5n },
          ],
          [],
        ],
        { value: ETH_1 },
      );

      const aliceEthAfter = await publicClient.getBalance({ address: alice.account.address });
      assert.equal(aliceEthAfter - aliceEthBefore, ETH_1);

      const bobBal = await token.read.balanceOf([bob.account.address]);
      const charlieBal = await token.read.balanceOf([charlie.account.address]);
      assert.equal(bobBal, ETH_1 * 10n);
      assert.equal(charlieBal, ETH_1 * 5n);
    });
  });
});
