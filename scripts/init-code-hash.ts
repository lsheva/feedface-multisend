import { artifacts } from "hardhat";
import { keccak256 } from "viem";
import { privateKeyToAddress } from "viem/accounts";

const artifact = await artifacts.readArtifact("FeedFaceMultisend");
const bytecode = artifact.bytecode as `0x${string}`;
const hash = keccak256(bytecode);
const wallet = privateKeyToAddress(process.env.PRIVATE_KEY as `0x${string}`);
if (!wallet) {
  throw new Error("PRIVATE_KEY is not valid");
}

console.log("Contract:       FeedFaceMultisend");
console.log("Bytecode length:", bytecode.length / 2 - 1, "bytes");
console.log("Init code hash:", hash);
console.log();
console.log("Usage with createXcrunch:");
console.log(
  `  createxcrunch create2 --code-hash ${hash} --caller ${wallet} --matching feedXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXface`,
);
