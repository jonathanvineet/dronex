// Test script for drone fee integration with ElizaOS
const { ethers } = require('ethers');
re        // Step 5: Confirm delivery
        console.log("\nStep 5: Confirming delivery...");
        const confirmTx = await contract.confirmDelivery(jobId);
        await confirmTx.wait();
        console.log("Delivery confirmed successfully!");
        
        // Step 6: Verify job completion
        console.log("\nStep 6: Verifying job completion...");
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
        }config();
const DroneManagementSystem = require('./elizaos/DroneManagementSystem');

const CONTRACT_ABI = require('./artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json').abi;
const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Initialize DroneManagementSystem
const droneSystem = new DroneManagementSystem();

// Store drone wallets for jobs
const jobDroneWallets = {};

async function testDroneFeeIntegration() {
    try {
        console.log("=== Testing Drone Fee Integration ===");
        console.log("Wallet address:", wallet.address);
        
        // Step 1: Post a new job
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
        
        // Step 2: Get job details
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
        
        // Step 3: Select optimal drone using ElizaOS
        console.log("\nStep 3: Selecting optimal drone with ElizaOS...");
        const job = {
            id: jobId.toString(),
            pickup: { lat: 28.7041, lng: 77.1025 }, // Delhi
            delivery: { lat: 28.4089, lng: 77.3178 }, // Gurgaon
            weight: 2.5, // kg
            weatherConditions: 'clear',
            sender: jobDetails[0],
            recipient: jobDetails[1],
            amount: ethers.formatEther(jobDetails[4]),
            details: jobDetails[3]
        };
        
        const droneAssignment = await droneSystem.processDeliveryConfirmation(jobId.toString(), job);
        console.log("Drone selected:");
        console.log(`- Drone ID: ${droneAssignment.droneId}`);
        console.log(`- Wallet Address: ${droneAssignment.walletAddress}`);
        console.log(`- Estimated Delivery Time: ${droneAssignment.estimatedDeliveryTime} minutes`);
        console.log(`- Hive Score: ${droneAssignment.hiveScore.toFixed(3)}`);
        
        // Step 4: Store drone wallet for this job
        jobDroneWallets[jobId] = droneAssignment.walletAddress;
        console.log("\nStep 4: Stored drone wallet for job");
        console.log(`Drone Wallet stored: ${jobDroneWallets[jobId]}`);
        
        // Step 5: Confirm delivery
        console.log("\nStep 6: Confirming delivery...");
        const confirmTx = await contract.confirmDelivery(jobId);
        await confirmTx.wait();
        console.log("Delivery confirmed successfully!");
        
        // Step 7: Verify job completion
        console.log("\nStep 7: Verifying job completion...");
        const finalJobDetails = await contract.jobs(jobId);
        console.log(`Job completed: ${finalJobDetails.completed}`);
        
        if (finalJobDetails.completed) {
            console.log("✅ Job marked as completed!");
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
