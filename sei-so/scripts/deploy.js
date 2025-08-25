const { ethers } = require("ethers");
const fs = require("fs");
require('dotenv').config();

const CONTRACT_JSON = require('../artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json');
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
  const factory = new ethers.ContractFactory(CONTRACT_JSON.abi, CONTRACT_JSON.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  console.log("Escrow deployed to:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
