// Test drone fee return to sender functionality
const { ethers } = require('ethers');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function testDroneFeeRefund() {
  console.log('Testing drone fee refund functionality...');
  
  // Load contract artifact
  const contractPath = path.resolve(__dirname, 'artifacts', 'contracts', 'DeliveryEscrow.sol', 'DeliveryEscrow.json');
  const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Get initial balances
  const initialSenderBalance = await provider.getBalance(wallet.address);
  console.log(`Initial sender balance: ${ethers.formatEther(initialSenderBalance)} SEI`);
  
  // Calculate amounts
  const baseAmount = "0.02"; // Base amount in SEI
  const droneAmount = ethers.parseEther(baseAmount).toString() * 0.1 / 1; // 10% of base amount
  const totalAmount = ethers.parseEther(baseAmount).toString() * 1.1 / 1; // Base + drone fee
  
  console.log(`Base amount: ${baseAmount} SEI`);
  console.log(`Drone fee: ${ethers.formatEther(droneAmount.toString())} SEI`);
  console.log(`Total amount: ${ethers.formatEther(totalAmount.toString())} SEI`);
  
  // Create contract instance
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS || "0x233D7487e447248DF9f71C6db46e8454254EB808",
    contractArtifact.abi,
    wallet
  );
  
  try {
    // Post a new job
    console.log('\nPosting new job with total amount (including drone fee)...');
    const recipient = "0xf1A68c0D4c1A8de334240050899324B713Cfc677"; // Example recipient
    const details = "Test job with drone fee refund";
    
    // Send transaction with total amount (base + drone fee)
    const tx = await contract.postJob(details, recipient, {
      value: ethers.parseEther(ethers.formatEther(totalAmount.toString()))
    });
    console.log(`Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log('Job posted successfully!');
    
    // Extract jobId
    let jobId = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        if (parsedLog && parsedLog.name === 'JobPosted') {
          jobId = parsedLog.args[0].toString();
          console.log(`Job ID: ${jobId}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!jobId) {
      console.error('Could not extract job ID!');
      return;
    }
    
    // Get job details
    const jobDetails = await contract.jobs(jobId);
    console.log('\nJob details:');
    console.log(`- Poster: ${jobDetails[0]}`);
    console.log(`- Recipient: ${jobDetails[1]}`);
    console.log(`- Fee Wallet: ${jobDetails[2]}`);
    
    // Complete the job (no drone assigned)
    console.log('\nCompleting job (no drone assigned)...');
    const completeTx = await contract.confirmDelivery(jobId);
    await completeTx.wait();
    console.log('Job completed!');
    
    // Check balances after completion
    const finalSenderBalance = await provider.getBalance(wallet.address);
    console.log(`\nFinal sender balance: ${ethers.formatEther(finalSenderBalance)} SEI`);
    
    // Account for gas costs - this is approximate
    console.log('\nAnalysis:');
    console.log('- Transaction costs (gas) impacted the final balance');
    console.log('- If drone fee was returned, the difference should be close to the base amount minus platform fee');
    console.log('- If drone fee was not returned, the difference would be close to the total amount');
    
    console.log('\nTest complete!');
    
  } catch (error) {
    console.error('Error testing drone fee refund:', error);
  }
}

testDroneFeeRefund()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
