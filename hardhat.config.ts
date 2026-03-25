import env from "node:process";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

env.loadEnvFile(".env");

const accounts = [configVariable("PRIVATE_KEY")];
const alchemy = (chain: string) =>
  configVariable("ALCHEMY_API_KEY", `https://${chain}.g.alchemy.com/v2/{variable}`);

export default defineConfig({
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
  plugins: [hardhatToolboxViem],
  solidity: {
    version: "0.8.28",
    settings: { viaIR: true, evmVersion: "paris", optimizer: { enabled: true, runs: 10000000 } },
  },
  networks: {
    // Testnets
    sepolia: { type: "http", url: alchemy("eth-sepolia"), accounts },
    "arbitrum-sepolia": { type: "http", url: alchemy("arb-sepolia"), accounts },
    "base-sepolia": { type: "http", chainType: "op", url: alchemy("base-sepolia"), accounts },
    "optimistm-sepolia": { type: "http", chainType: "op", url: alchemy("opt-sepolia"), accounts },

    // Mainnets
    ethereum: { type: "http", url: alchemy("eth-mainnet"), accounts },
    arbitrum: { type: "http", url: alchemy("arb-mainnet"), accounts },
    base: { type: "http", chainType: "op", url: alchemy("base-mainnet"), accounts },
    optimism: { type: "http", chainType: "op", url: alchemy("opt-mainnet"), accounts },
    polygon: { type: "http", url: alchemy("polygon-mainnet"), accounts },
    avalanche: { type: "http", url: alchemy("avax-mainnet"), accounts },
    bnb: { type: "http", url: alchemy("bnb-mainnet"), accounts },
    gnosis: { type: "http", url: alchemy("gnosis-mainnet"), accounts },
    scroll: { type: "http", url: alchemy("scroll-mainnet"), accounts },
    linea: { type: "http", url: alchemy("linea-mainnet"), accounts },
    blast: { type: "http", url: alchemy("blast-mainnet"), accounts },
    zksync: { type: "http", url: alchemy("zksync-mainnet"), accounts },
    polygonZkEvm: { type: "http", url: alchemy("polygonzkevm-mainnet"), accounts },
    celo: { type: "http", url: alchemy("celo-mainnet"), accounts },
    mantle: { type: "http", url: alchemy("mantle-mainnet"), accounts },
    arbitrumNova: { type: "http", url: alchemy("arbnova-mainnet"), accounts },
    zora: { type: "http", chainType: "op", url: alchemy("zora-mainnet"), accounts },
    mode: { type: "http", chainType: "op", url: alchemy("mode-mainnet"), accounts },
    sonic: { type: "http", url: alchemy("sonic-mainnet"), accounts },
    unichain: { type: "http", chainType: "op", url: alchemy("unichain-mainnet"), accounts },
    ink: { type: "http", chainType: "op", url: alchemy("ink-mainnet"), accounts },
    berachain: { type: "http", url: alchemy("berachain-mainnet"), accounts },
    abstract: { type: "http", url: alchemy("abstract-mainnet"), accounts },
    soneium: { type: "http", url: alchemy("soneium-mainnet"), accounts },
    worldchain: { type: "http", chainType: "op", url: alchemy("worldchain-mainnet"), accounts },
    shape: { type: "http", url: alchemy("shape-mainnet"), accounts },
    metis: { type: "http", url: alchemy("metis-mainnet"), accounts },
    frax: { type: "http", chainType: "op", url: alchemy("frax-mainnet"), accounts },
    opbnb: { type: "http", chainType: "op", url: alchemy("opbnb-mainnet"), accounts },
  },
});
