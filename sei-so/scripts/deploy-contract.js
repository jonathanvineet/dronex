// Script to deploy the updated DeliveryEscrow contract
const { ethers } = require('ethers');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Deploying DeliveryEscrow contract...');
  
  // Load contract artifact
  const contractPath = path.resolve(__dirname, 'artifacts', 'contracts', 'DeliveryEscrow.sol', 'DeliveryEscrow.json');
  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`Deploying from address: ${wallet.address}`);
  
  // Deploy contract
  const ContractFactory = new ethers.ContractFactory(
    contractArtifact.abi,
    contractArtifact.bytecode,
    wallet
  );
  
  const contract = await ContractFactory.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log(`Contract deployed to address: ${contractAddress}`);
  
  // Update CONTRACT_ADDRESS in necessary files (backend.js, pages/index.js)
  console.log('Updating CONTRACT_ADDRESS in backend.js and pages/index.js...');
  
  // Update backend.js
  const backendPath = path.resolve(__dirname, 'backend.js');
  let backendContent = fs.readFileSync(backendPath, 'utf8');
  backendContent = backendContent.replace(
    /const CONTRACT_ADDRESS = ".*";/,
    `const CONTRACT_ADDRESS = "${contractAddress}";`
  );
  fs.writeFileSync(backendPath, backendContent);
  
  // Update pages/index.js
  const frontendPath = path.resolve(__dirname, 'pages', 'index.js');
  let frontendContent = fs.readFileSync(frontendPath, 'utf8');
  frontendContent = frontendContent.replace(
    /const CONTRACT_ADDRESS = ".*";/,
    `const CONTRACT_ADDRESS = "${contractAddress}";`
  );
  fs.writeFileSync(frontendPath, frontendContent);
  
  console.log('Deployment complete! Files updated with new contract address.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment error:', error);
    process.exit(1);
  });
