require('dotenv').config();
require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: "0.8.20",
  networks: {
    sei_testnet: {
      url: "https://evm-rpc-testnet.sei-apis.com",
      chainId: 1328,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
