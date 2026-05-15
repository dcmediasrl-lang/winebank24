import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
const accounts = privateKey ? [privateKey] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    polygonAmoy: {
      url: process.env.POLYGON_RPC_URL ?? "https://rpc-amoy.polygon.technology",
      accounts,
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts,
    },
  },
};

export default config;
