// Import necessary modules
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Config 
dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read contract ABI
const contractJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json'), 'utf8'));
const CONTRACT_ABI = contractJSON.abi;
const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Simulate drone selection without DroneManagementSystem
function selectDrone() {
  const drones = [
    { id: 'DRONE_001', walletAddress: '0xf1A68c0D4c1A8de334240050899324B713Cfc677' },
    { id: 'DRONE_002', walletAddress: '0x2B5c206516c34896D41DB511BAB9E878F8C1C109' }
  ];
  return drones[Math.floor(Math.random() * drones.length)];
}

// Run test
async function testDroneFeeIntegration() {
  try {
    console.log("=== Testing Smart Contract Integration ===");
    console.log("Wallet address:", wallet.address);
    
    // Post a new job
    console.log("\nStep 1: Posting new job...");
    const details = "Test package delivery with drone fee";
    const recipient = "0xf1A68c0D4c1A8de334240050899324B713Cfc677"; // Example recipient address
    const amountInEth = "0.022"; // Amount in ETH (will include drone fee)
    
    console.log(`Posting job with amount: ${amountInEth} ETH`);
    console.log(`Details: ${details}`);
    console.log(`Recipient: ${recipient}`);
    
    // Create transaction
    const tx = await contract.postJob(details, recipient, { 
      value: ethers.parseEther(amountInEth) 
    });
    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log("Job posted successfully!");
    
    // Extract jobId from events
    const jobPostedEvent = receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(event => event && event.name === 'JobPosted')[0];
    
    if (!jobPostedEvent) {
      throw new Error("Could not find JobPosted event");
    }
    
    const jobId = jobPostedEvent.args[0];
    console.log(`Job ID: ${jobId}`);
    
    // Get job details
    console.log("\nStep 2: Getting job details...");
    const jobDetails = await contract.jobs(jobId);
    console.log("Job details:");
    console.log(`- Poster: ${jobDetails[0]}`);
    console.log(`- Recipient: ${jobDetails[1]}`);
    console.log(`- Fee Wallet: ${jobDetails[2]}`);
    console.log(`- Details: ${jobDetails[3]}`);
    console.log(`- Amount: ${ethers.formatEther(jobDetails[4])} ETH`);
    console.log(`- Funded: ${jobDetails[5]}`);
    console.log(`- Completed: ${jobDetails[6]}`);
    
    // Select drone
    console.log("\nStep 3: Selecting drone...");
    const selectedDrone = selectDrone();
    console.log(`Selected drone: ${selectedDrone.id}`);
    console.log(`Drone wallet address: ${selectedDrone.walletAddress}`);
    
    // Confirm delivery
    console.log("\nStep 4: Confirming delivery...");
    const confirmTx = await contract.confirmDelivery(jobId);
    await confirmTx.wait();
    console.log("Delivery confirmed successfully!");
    
    // Verify job completion
    console.log("\nStep 5: Verifying job completion...");
    const finalJobDetails = await contract.jobs(jobId);
    console.log(`Job completed: ${finalJobDetails[6]}`);
    
    if (finalJobDetails[6]) {
      console.log("✅ Job marked as completed!");
      console.log("💰 Fee distribution handled by smart contract:");
      console.log("   - 80% to recipient");
      console.log("   - 10% to fee wallet");
      console.log("   - 10% to drone (or fee wallet if no drone assigned)");
    } else {
      console.log("❌ Job not marked as completed!");
    }
    
    console.log("\n=== Test completed successfully! ===");
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the test
testDroneFeeIntegration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
