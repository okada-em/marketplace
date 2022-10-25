import '@nomiclabs/hardhat-etherscan';
import '@nomicfoundation/hardhat-toolbox';
import dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import 'hardhat-contract-sizer';
import 'hardhat-prettier';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  }
};

export default config;
