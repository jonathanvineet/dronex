const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.wallet.atlantic-2.sei.io");
  const address = ethers.getAddress("0x2B5c206516c34896D41DB511BAB9e878F8C1c109");
  const balance = await provider.getBalance(address);
  console.log("Balance (SEI):", ethers.formatEther(balance));
}

main();
