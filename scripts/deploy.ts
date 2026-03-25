import hre from "hardhat";
import { artifacts, network } from "hardhat";
import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";
import { concat, getCreate2Address, keccak256, pad } from "viem";

const CREATEX = "0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed" as const;

const createXAbi = [
  {
    type: "function",
    name: "deployCreate2",
    inputs: [
      { name: "salt", type: "bytes32" },
      { name: "initCode", type: "bytes" },
    ],
    outputs: [{ name: "newContract", type: "address" }],
    stateMutability: "payable",
  },
] as const;

const salt = process.env.SALT as `0x${string}` | undefined;
if (!salt) {
  console.error(
    "SALT env var is required. Run init-code-hash first, then mine with createXcrunch.",
  );
  process.exit(1);
}

const { viem, networkName } = await network.connect();
const [deployer] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

const artifact = await artifacts.readArtifact("MultiSend");
const bytecode = artifact.bytecode as `0x${string}`;
const initCodeHash = keccak256(bytecode);

// Replicate CreateX _guard for permissioned deploy (sender in first 20 bytes, byte 20 = 0x00)
// guardedSalt = keccak256(bytes32(uint256(uint160(msg.sender))) || salt)
const senderPadded = pad(deployer.account.address, { size: 32 });
const guardedSalt = keccak256(concat([senderPadded, salt]));

const expectedAddress = getCreate2Address({
  from: CREATEX,
  salt: guardedSalt,
  bytecodeHash: initCodeHash,
});

console.log(`Network:          ${networkName}`);
console.log(`Deployer:         ${deployer.account.address}`);
console.log(`Salt:             ${salt}`);
console.log(`Init code hash:   ${initCodeHash}`);
console.log(`Expected address: ${expectedAddress}`);
console.log();

const code = await publicClient.getCode({ address: expectedAddress });
if (code && code !== "0x") {
  console.log("Contract already deployed at this address. Skipping.");
  process.exit(0);
}

console.log("Deploying via CreateX.deployCreate2...");

const hash = await deployer.writeContract({
  address: CREATEX,
  abi: createXAbi,
  functionName: "deployCreate2",
  args: [salt, bytecode],
});

console.log(`Tx hash: ${hash}`);
console.log("Waiting for confirmation...");

const receipt = await publicClient.waitForTransactionReceipt({
  hash,
  confirmations: 1,
});

if (receipt.status === "reverted") {
  console.error("Transaction reverted!");
  process.exit(1);
}

const deployedCode = await publicClient.getCode({ address: expectedAddress });
if (!deployedCode || deployedCode === "0x") {
  console.error("Deployment verification failed -- contract not found at expected address");
  process.exit(1);
}

console.log(`Deployed at: ${expectedAddress}`);
console.log();

console.log("Verifying on block explorers (waiting 10s for indexing)...");
await new Promise((r) => setTimeout(r, 10_000));

for (const provider of ["etherscan", "blockscout", "sourcify"] as const) {
  try {
    await verifyContract({ address: expectedAddress, provider }, hre);
    console.log(`  ${provider}: verified`);
  } catch (e) {
    console.log(`  ${provider}: ${e instanceof Error ? e.message : "failed"}`);
  }
}
