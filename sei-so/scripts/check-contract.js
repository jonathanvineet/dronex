// Script to check the compatibility between the ABI and deployed contract
const { ethers } = require('ethers');
try {
  require('dotenv').config();
} catch (e) {
  console.log('No .env file found, using defaults');
}

// Contract ABI and address
const CONTRACT_ABI = require('../artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json').abi;
const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";

// Provider setup - use read-only provider since we're just querying
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

async function checkContract() {
  console.log(`Checking contract at ${CONTRACT_ADDRESS}...`);
  
  try {
    // Check the contract ABI
    console.log('\n=== Contract ABI Analysis ===');
    const functions = CONTRACT_ABI.filter(item => item.type === 'function');
    console.log(`Total functions in ABI: ${functions.length}`);
    
    console.log('\nFunction names in ABI:');
    functions.forEach(func => {
      console.log(`- ${func.name}(${func.inputs.map(i => i.type).join(', ')})`);
    });
    
    // Check if contract exists on chain
    console.log('\n=== On-Chain Contract Check ===');
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.log('WARNING: No contract deployed at this address!');
      return;
    }
    
    console.log('Contract found at the provided address');
    
    // Try to get job count
    try {
      const jobCount = await contract.jobCount();
      console.log(`\nJob count: ${jobCount.toString()}`);
      
      if (jobCount > 0) {
        // Try to get the first job
        try {
          console.log('\nAttempting to get job #1...');
          const job = await contract.jobs(1);
          console.log('Job #1 details:');
          console.log('- Poster:', job.poster);
          console.log('- Recipient:', job.recipient);
          console.log('- Fee wallet:', job.feeWallet);
          console.log('- Drone wallet:', job.droneWallet);
          console.log('- Amount:', ethers.formatEther(job.amount), 'ETH');
          console.log('- Details:', job.details);
          console.log('- Funded:', job.funded);
          console.log('- Completed:', job.completed);
        } catch (jobErr) {
          console.error('\nError getting job details:', jobErr.message);
          console.log('\nRaw error:', jobErr);
        }
      }
    } catch (err) {
      console.error('\nError getting job count:', err.message);
      console.log('\nPossible ABI mismatch with deployed contract');
    }
    
    // Try to decode the expected structure
    console.log('\n=== Contract Structure Analysis ===');
    try {
      const jobsFunction = functions.find(f => f.name === 'jobs');
      if (jobsFunction) {
        console.log('Structure of Job struct from ABI:');
        jobsFunction.outputs.forEach(output => {
          console.log(`- ${output.name}: ${output.type}`);
        });
      }
    } catch (err) {
      console.error('Error analyzing contract structure:', err.message);
    }
    
  } catch (error) {
    console.error('Error checking contract:', error);
  }
}

checkContract().catch(console.error);
