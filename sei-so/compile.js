// Simple script to compile Solidity contracts without using Hardhat
const fs = require('fs');
const path = require('path');
const solc = require('solc');

// Path to the contract
const contractPath = path.resolve(__dirname, 'contracts', 'DeliveryEscrow.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Compile contract
const input = {
  language: 'Solidity',
  sources: {
    'DeliveryEscrow.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

console.log('Compiling DeliveryEscrow.sol...');

try {
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for errors
  if (output.errors) {
    let hasError = false;
    output.errors.forEach(error => {
      if (error.severity === 'error') {
        hasError = true;
      }
      console.error(error.formattedMessage);
    });

    if (hasError) {
      console.error('Compilation failed due to errors.');
      process.exit(1);
    }
  }

  // Get contract
  const contractOutput = output.contracts['DeliveryEscrow.sol']['DeliveryEscrow'];
  
  // Create output directory if it doesn't exist
  const outputDir = path.resolve(__dirname, 'artifacts', 'contracts', 'DeliveryEscrow.sol');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save compiled contract
  fs.writeFileSync(
    path.resolve(outputDir, 'DeliveryEscrow.json'),
    JSON.stringify({
      _format: "hh-sol-artifact-1",
      contractName: "DeliveryEscrow",
      sourceName: "contracts/DeliveryEscrow.sol",
      abi: contractOutput.abi,
      bytecode: contractOutput.evm.bytecode.object,
      deployedBytecode: contractOutput.evm.deployedBytecode.object,
      linkReferences: {},
      deployedLinkReferences: {}
    }, null, 2)
  );

  console.log('Contract successfully compiled and saved to artifacts directory.');

} catch (error) {
  console.error('Error compiling contract:', error);
  process.exit(1);
}
