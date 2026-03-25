import { artifacts } from "hardhat";
import { keccak256 } from "viem";

const artifact = await artifacts.readArtifact("MultiSend");
const bytecode = artifact.bytecode as `0x${string}`;
const hash = keccak256(bytecode);

console.log("Contract:       MultiSend");
console.log("Bytecode length:", bytecode.length / 2 - 1, "bytes");
console.log("Init code hash:", hash);
console.log();
console.log("Usage with createXcrunch:");
console.log(
  `  createxcrunch create2 --code-hash ${hash} --caller <YOUR_ADDRESS> --matching feed1faceXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`,
);
