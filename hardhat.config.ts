import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
//require("dotenv").config();
import "dotenv/config";

const config: HardhatUserConfig = {
	solidity: "0.8.9",
	paths: { tests: "test" },
	networks: {
		testnet: {
			url: "https://data-seed-prebsc-1-s1.binance.org:8545",
			chainId: 97,
			gasPrice: 20000000000,
			accounts: { mnemonic: process.env.MNEMONIC },
		},
		/*
		mainnet: {
			url: "https://bsc-dataseed.binance.org/",
			chainId: 56,
			gasPrice: 20000000000,
			accounts: { mnemonic: mnemonic },
		},
		*/
	},
	etherscan: {
		// Your API key for Etherscan
		// Obtain one at https://bscscan.com/
		apiKey: process.env.bscscanApiKey,
	},
};

export default config;
