require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const DroneManagementSystem = require('./elizaos/DroneManagementSystem');

const CONTRACT_ABI = require('./artifacts/contracts/DeliveryEscrow.sol/DeliveryEscrow.json').abi;
const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";
const provider = new ethers.JsonRpcProvider("https://evm-rpc-testnet.sei-apis.com");

// The wallet used for general operations
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// The wallet that is used as the job poster - must be the same account that posts jobs
const posterWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// Connect contract with poster wallet
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, posterWallet);

// Initialize ElizaOS Drone Management System
const droneSystem = new DroneManagementSystem();


// Helper function to validate job exists and get job details
async function getJobDetails(jobId) {
  try {
    const job = await contract.jobs(jobId);
    
    // Check if job exists (poster should not be zero address for valid jobs)
    if (job.poster === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Job ${jobId} does not exist`);
    }
    
    return job;
  } catch (error) {
    console.error(`[ERROR] Failed to get job details for job ${jobId}:`, error.message);
    throw error;
  }
}

// Check if contract supports assignDrone function
async function checkContractSupport() {
  try {
    // Try to get the assignDrone function
    const fragment = contract.interface.getFunction('assignDrone');
    return fragment !== null;
  } catch (error) {
    console.log(`[INFO] Contract does not support assignDrone function`);
    return false;
  }
}

// Contract fund distribution function
async function performManualDistribution(jobId, droneWallet, storeWallet, totalAmountSEI) {
  try {
    console.log(`[CONTRACT] Starting fund distribution for job ${jobId}`);
    console.log(`[CONTRACT] Total amount: ${totalAmountSEI} SEI`);
    console.log(`[CONTRACT] Drone wallet: ${droneWallet}`);
    console.log(`[CONTRACT] Store wallet: ${storeWallet}`);
    
    // Convert amount to Wei
    const totalAmountWei = ethers.parseEther(totalAmountSEI.toString());
    
    // Calculate distribution (assuming 10% to drone, 90% to store)
    const droneAmountWei = (totalAmountWei * 10n) / 100n; // 10% to drone
    const storeAmountWei = (totalAmountWei * 90n) / 100n;  // 90% to store
    
    console.log(`[CONTRACT] Distribution breakdown:`);
    console.log(`  - Drone (10%): ${ethers.formatEther(droneAmountWei)} SEI`);
    console.log(`  - Store (90%): ${ethers.formatEther(storeAmountWei)} SEI`);
    
    const transactions = [];
    
    // Send to drone wallet
    if (droneAmountWei > 0n && droneWallet && droneWallet !== '0x0000000000000000000000000000000000000000') {
      try {
        // Validate address format before sending
        if (!ethers.isAddress(droneWallet)) {
          throw new Error(`Invalid drone wallet address format: ${droneWallet}`);
        }
        
        console.log(`[CONTRACT] Sending ${ethers.formatEther(droneAmountWei)} SEI to drone wallet ${droneWallet}...`);
        const droneTx = await posterWallet.sendTransaction({
          to: droneWallet,
          value: droneAmountWei
        });
        await droneTx.wait();
        transactions.push({ recipient: 'drone', wallet: droneWallet, amount: ethers.formatEther(droneAmountWei), txHash: droneTx.hash });
        console.log(`[CONTRACT] ✅ Drone payment sent: ${droneTx.hash}`);
      } catch (droneErr) {
        console.error(`[CONTRACT] ❌ Failed to send to drone wallet:`, droneErr.message);
        console.log(`[CONTRACT] ℹ️ Skipping drone payment due to error`);
      }
    } else {
      console.log(`[CONTRACT] ⚠️  Skipping drone payment - invalid wallet or zero amount`);
    }
    
    // Send to store wallet
    if (storeAmountWei > 0n && storeWallet && storeWallet !== '0x0000000000000000000000000000000000000000') {
      try {
        console.log(`[CONTRACT] Sending ${ethers.formatEther(storeAmountWei)} SEI to store wallet ${storeWallet}...`);
        const storeTx = await posterWallet.sendTransaction({
          to: storeWallet,
          value: storeAmountWei
        });
        await storeTx.wait();
        transactions.push({ recipient: 'store', wallet: storeWallet, amount: ethers.formatEther(storeAmountWei), txHash: storeTx.hash });
        console.log(`[CONTRACT] ✅ Store payment sent: ${storeTx.hash}`);
      } catch (storeErr) {
        console.error(`[CONTRACT] ❌ Failed to send to store wallet:`, storeErr.message);
      }
    } else {
      console.log(`[CONTRACT] ⚠️  Skipping store payment - invalid wallet or zero amount`);
    }
    
    // Update job status
    jobStatus[jobId] = 'funds-distributed-contract';
    
    console.log(`[CONTRACT] Fund distribution completed for job ${jobId}`);
    console.log(`[CONTRACT] Transactions completed: ${transactions.length}`);
    transactions.forEach(tx => {
      console.log(`  - ${tx.recipient}: ${tx.amount} SEI to ${tx.wallet} (${tx.txHash})`);
    });
    
    return {
      success: true,
      transactions,
      totalDistributed: ethers.formatEther(droneAmountWei + storeAmountWei),
      jobId
    };
    
  } catch (error) {
    console.error(`[CONTRACT] Error in fund distribution for job ${jobId}:`, error);
    return {
      success: false,
      error: error.message,
      jobId
    };
  }
}

const jobStatus = {}; // jobId: 'pending' | 'confirmed'
const jobDroneWallets = {}; // jobId: droneWalletAddress

const app = express();
app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.post('/job', async (req, res) => {
  const { jobId } = req.body;
  console.log(`[LOCAL] Job posted: jobId=${jobId}`);
  jobStatus[jobId] = 'pending';
  
  // Get the job info to verify the poster and validate job exists
  try {
    let job;
    try {
      job = await getJobDetails(jobId);
      console.log(`[INFO] Job ${jobId} details:`);
      console.log(`  Poster: ${job.poster}`);
      console.log(`  Recipient: ${job.recipient}`);
      console.log(`  Amount: ${ethers.formatEther(job.amount)} SEI`);
      console.log(`  Funded: ${job.funded}`);
      console.log(`  Completed: ${job.completed}`);
      console.log(`  Drone Wallet: ${job.droneWallet}`);
    } catch (jobErr) {
      console.error(`[ERROR] Could not fetch job details for job ${jobId}:`, jobErr.message);
      return res.status(400).json({ 
        status: 'Error', 
        message: `Job ${jobId} not found on-chain`,
        jobId 
      });
    }

    // Verify the poster wallet matches
    if (job.poster.toLowerCase() !== posterWallet.address.toLowerCase()) {
      console.error(`[ERROR] Poster mismatch for job ${jobId}. Expected: ${posterWallet.address}, Got: ${job.poster}`);
      return res.status(403).json({ 
        status: 'Error', 
        message: `Unauthorized: wallet mismatch for job ${jobId}`,
        jobId 
      });
    }

    // Check if job is already completed
    if (job.completed) {
      console.log(`[INFO] Job ${jobId} is already completed`);
      return res.json({ status: 'Job already completed', jobId });
    }

    // Check if job is funded
    if (!job.funded) {
      console.error(`[ERROR] Job ${jobId} is not funded`);
      return res.status(400).json({ 
        status: 'Error', 
        message: `Job ${jobId} is not funded`,
        jobId 
      });
    }

    // Check contract support for assignDrone
    const contractSupportsAssignDrone = await checkContractSupport();
    console.log(`[INFO] Contract supports assignDrone: ${contractSupportsAssignDrone}`);
    console.log(`Current wallet address: ${posterWallet.address}`);
    
    // First, use ElizaOS to process the delivery with drone management
    console.log(`[ELIZA] Activating ElizaOS for job ${jobId}...`);
    
    try {
      // We'll use the job object we already have instead of querying again
      const jobDetails = job;
      
      // Process with ElizaOS drone management to select optimal drone
      const droneAssignment = await droneSystem.processDeliveryConfirmation(jobId, {
        sender: jobDetails.poster || posterWallet.address,
        recipient: jobDetails.recipient || "0xa50050dbdbe672a5f0261e403909bcb8590b9130", // Default recipient
  amount: jobDetails.amount ? ethers.formatEther(jobDetails.amount) : "0.001", // Default amount
        details: jobDetails.details || "Default delivery details"
      });
      
      console.log(`[ELIZA] Drone assignment complete for job ${jobId}:`);
      console.log(`[ELIZA] Selected drone: ${droneAssignment.droneId}`);
      console.log(`[ELIZA] Drone wallet: ${droneAssignment.walletAddress}`);
      console.log(`[ELIZA] Estimated delivery time: ${droneAssignment.estimatedDeliveryTime} minutes`);
      console.log(`[ELIZA] Hive intelligence score: ${droneAssignment.hiveScore.toFixed(3)}`);
      
      // Store the selected drone wallet for this job
      jobDroneWallets[jobId] = droneAssignment.walletAddress;
      console.log(`[SUCCESS] Drone wallet ${droneAssignment.walletAddress} stored for job ${jobId}`);
      
      // After selecting the drone, confirm the delivery
      setTimeout(async () => {
        try {
          console.log(`[ACTION] Confirming delivery for job ${jobId} after 10 seconds...`);

          // Detect whether the contract supports direct drone assignment
          const contractSupportsAssignDrone = CONTRACT_ABI.some(item => 
            item.name === 'assignDrone' && 
            item.type === 'function'
          );

          // Track whether we successfully assigned on-chain
          let assignedOnChain = false;

          // Try to assign the drone wallet first if the contract supports it
          if (contractSupportsAssignDrone) {
            try {
              console.log(`[ACTION] Assigning drone wallet ${droneAssignment.walletAddress} to job ${jobId} on-chain...`);
              
              // First, try to estimate gas to see if the transaction will succeed
              const gasEstimate = await contract.assignDrone.estimateGas(jobId, droneAssignment.walletAddress);
              console.log(`[INFO] Gas estimate for assignDrone: ${gasEstimate.toString()}`);
              
              // Proceed with the transaction if gas estimation succeeds
              const assignTx = await contract.assignDrone(jobId, droneAssignment.walletAddress, {
                gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
              });
              await assignTx.wait();
              assignedOnChain = true;
              console.log(`[SUCCESS] Drone wallet assigned on-chain for job ${jobId}`);
            } catch (assignErr) {
              console.error(`[WARNING] Could not assign drone on-chain:`, assignErr.message || assignErr);
              
              // Check specific error types
              if (assignErr.code === 'CALL_EXCEPTION') {
                console.log(`[INFO] Transaction would revert - possible reasons:`);
                console.log(`  - Job not funded`);
                console.log(`  - Job already completed`);
                console.log(`  - Drone already assigned`);
                console.log(`  - Invalid job ID`);
              }
              
              console.log(`[INFO] Will continue with local assignment only`);
            }
          } else {
            console.log(`[INFO] Contract does not support direct drone assignment, using local tracking only`);
          }

          // Confirm delivery on-chain (this performs distribution according to contract logic)
          try {
            console.log(`[ACTION] Confirming delivery for job ${jobId}...`);
            
            // Check if job exists and is valid before confirming
            const jobBeforeConfirm = await contract.jobs(jobId);
            if (!jobBeforeConfirm.funded) {
              throw new Error(`Job ${jobId} is not funded`);
            }
            if (jobBeforeConfirm.completed) {
              throw new Error(`Job ${jobId} is already completed`);
            }
            
            // Estimate gas for confirmDelivery
            const gasEstimate = await contract.confirmDelivery.estimateGas(jobId);
            console.log(`[INFO] Gas estimate for confirmDelivery: ${gasEstimate.toString()}`);
            
            const tx = await contract.confirmDelivery(jobId, {
              gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
            });
            await tx.wait();
            jobStatus[jobId] = 'confirmed';
            console.log(`[SUCCESS] Delivery confirmed for job ${jobId}`);
          } catch (confirmErr) {
            console.error(`[ERROR] Failed to confirm delivery on-chain for job ${jobId}:`, confirmErr.message || confirmErr);
            
            // Check specific error types
            if (confirmErr.code === 'CALL_EXCEPTION') {
              console.log(`[INFO] Confirm delivery would revert - possible reasons:`);
              console.log(`  - Job not funded`);
              console.log(`  - Job already completed`);
              console.log(`  - Caller is not the job poster`);
              console.log(`  - Invalid job ID`);
            }
            
            throw confirmErr; // Re-throw to be caught by outer try-catch
          }

          // Now verify whether the drone received the droneAmount on-chain.
          // If we couldn't assign on-chain or the on-chain job shows no drone wallet,
          // perform a manual payout of the drone fee (10%) from posterWallet to the drone wallet.
          let onChainDroneWallet = null;
          let onChainJob = null;
          try {
            onChainJob = await contract.jobs(jobId);
            onChainDroneWallet = onChainJob.droneWallet;
          } catch (readErr) {
            console.log(`[WARNING] Could not read job ${jobId} after confirmDelivery — will assume drone not paid on-chain.`);
          }

          // Only do manual payout if we have a drone wallet stored locally and either
          // - we did not assign on-chain, or
          // - on-chain job shows zero address for droneWallet
          const localDrone = jobDroneWallets[jobId];
          const zeroAddress = '0x0000000000000000000000000000000000000000';

          const needsManualPayout = localDrone && (!assignedOnChain || !onChainDroneWallet || onChainDroneWallet === zeroAddress);

          if (needsManualPayout) {
            console.log(`[INFO] Performing manual drone payout to ${localDrone} for job ${jobId}`);

            // Determine job amount in wei (robust handling)
            let jobAmountWei;
            try {
              // Prefer local job.amount when available and non-zero
              const localAmountAvailable = job && job.amount !== undefined && job.amount !== null && !(typeof job.amount === 'number' && job.amount === 0);

              if (localAmountAvailable) {
                // Parse local job.amount
                if (typeof job.amount === 'object' && typeof job.amount.toString === 'function') {
                  jobAmountWei = BigInt(job.amount.toString());
                } else if (typeof job.amount === 'bigint') {
                  jobAmountWei = job.amount;
                } else if (typeof job.amount === 'string') {
                  if (job.amount.includes('.')) {
                    jobAmountWei = BigInt(ethers.parseEther(job.amount).toString());
                  } else {
                    jobAmountWei = BigInt(job.amount);
                  }
                } else if (typeof job.amount === 'number') {
                  jobAmountWei = BigInt(ethers.parseEther(String(job.amount)).toString());
                } else {
                  jobAmountWei = BigInt(ethers.parseEther('0.1').toString());
                }
              } else if (onChainJob && onChainJob.amount !== undefined && onChainJob.amount !== null) {
                // Use on-chain job amount if available
                jobAmountWei = BigInt(onChainJob.amount.toString());
                console.log(`[INFO] Using on-chain job amount for job ${jobId}: ${jobAmountWei.toString()} wei`);
              } else {
                // Fallback to default
                jobAmountWei = BigInt(ethers.parseEther('0.1').toString());
              }
            } catch (amtErr) {
              console.error(`[WARNING] Error determining job amount for job ${jobId}:`, amtErr);
              jobAmountWei = BigInt(ethers.parseEther('0.1').toString());
            }

            // 10% drone fee
            const droneAmountWei = (BigInt(jobAmountWei) * 10n) / 100n;

            if (droneAmountWei > 0n) {
              try {
                const payoutTx = await posterWallet.sendTransaction({ to: localDrone, value: droneAmountWei });
                await payoutTx.wait();
                console.log(`[SUCCESS] Manual drone payout sent for job ${jobId}: ${payoutTx.hash}`);
              } catch (payoutErr) {
                console.error(`[ERROR] Manual drone payout failed for job ${jobId}:`, payoutErr);
              }
            } else {
              console.log(`[INFO] Computed drone payout is zero for job ${jobId}, skipping manual payout.`);
            }
          } else {
            console.log(`[INFO] No manual payout needed for job ${jobId} (either paid on-chain or no local drone recorded).`);
          }

          console.log(`[INFO] Drone fee handling complete for job ${jobId}`);
        } catch (err) {
          console.error(`[ERROR] Confirming delivery for job ${jobId}:`, err);
          console.log(`Wallet address used: ${posterWallet.address}`);
        }
      }, 10000);
    } catch (elizaErr) {
      console.error(`[ELIZA] Error processing job with ElizaOS:`, elizaErr);
    }
  } catch (err) {
    console.error(`[ERROR] Getting job info for ${jobId}:`, err);
  }
  
  res.json({ status: 'Job received', jobId });
});

app.get('/job/:jobId/status', (req, res) => {
  const jobId = req.params.jobId;
  const status = jobStatus[jobId] || 'pending';
  res.json({ status });
});

// API endpoints for drone management
app.get('/api/drones', (req, res) => {
  res.json({
    drones: droneSystem.droneFleet,
    activeJobs: Array.from(droneSystem.activeJobs.values())
  });
});

// Hive intelligence analytics
app.get('/api/hive-analytics', (req, res) => {
  const analytics = droneSystem.generateHiveAnalytics();
  res.json(analytics);
});

// Manual drone assignment for testing
app.post('/api/assign-drone', async (req, res) => {
  try {
    const { jobId, pickup, delivery, weight } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ success: false, error: 'Missing jobId' });
    }
    
    const job = {
      id: jobId,
      pickup: pickup || { lat: 15.2993, lng:74.1240}, // Default to Delhi
      delivery: delivery || { lat: 28.4089, lng: 77.3178 }, // Default to Gurgaon
      weight: weight || 2.5, // Default weight in kg
      weatherConditions: 'clear'
    };
    
    // Select optimal drone using ElizaOS
    const droneAssignment = await droneSystem.processDeliveryConfirmation(jobId, job);
    
    // Store the drone wallet for this job
    jobDroneWallets[jobId] = droneAssignment.walletAddress;
    console.log(`[API] Drone wallet ${droneAssignment.walletAddress} stored for job ${jobId}`);
    
    // Check contract version to see if direct assignment is supported
    let contractSupportsAssignDrone = false;
    try {
      // Check if the contract has the assignDrone function by checking the ABI
      contractSupportsAssignDrone = CONTRACT_ABI.some(item => 
        item.name === 'assignDrone' && 
        item.type === 'function'
      );
      
      if (contractSupportsAssignDrone) {
        console.log(`[API] Contract supports direct drone assignment, will try to assign on-chain`);
      } else {
        console.log(`[API] Contract does not support direct drone assignment, storing in memory only`);
      }
    } catch (err) {
      console.log(`[API] Error checking contract capabilities:`, err.message);
    }
    
    res.json({
      success: true,
      jobId,
      assignment: droneAssignment,
      droneWalletStored: true,
      contractSupportsAssignDrone
    });
  } catch (error) {
    console.error('[API] Error assigning drone:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// DRONE API ENDPOINTS FOR FRONTEND
// ==========================================

// Get available drones
app.get('/api/drones/available', async (req, res) => {
  try {
    console.log('[API] Fetching available drones from ElizaOS...');
    
    // Get drone fleet status from ElizaOS
    const fleetStatus = droneSystem.getFleetStatus();
    
    // Format drones for frontend
    const availableDrones = fleetStatus
      .filter(drone => drone.status === 'available' || drone.status === 'idle')
      .map(drone => ({
        id: drone.id,
        name: drone.name || `ElizaOS ${drone.id}`,
        status: drone.status,
        location: drone.location || { 
          lat: 40.7128 + (Math.random() - 0.5) * 0.1, 
          lng: -74.0060 + (Math.random() - 0.5) * 0.1, 
          address: `Station ${drone.id.slice(-3)}` 
        },
        batteryLevel: drone.batteryLevel || Math.floor(Math.random() * 20) + 80,
        maxPayload: drone.capabilities?.maxPayload || 5,
        estimatedRange: drone.capabilities?.range || 15,
        walletAddress: drone.walletAddress,
        aiIntelligence: drone.aiStatus || 'Hive Mind Connected',
        capabilities: drone.capabilities?.features || ['GPS Navigation', 'Obstacle Avoidance', 'Secure Drop'],
        lastActive: drone.lastSeen || new Date().toISOString()
      }));

    res.json({
      success: true,
      drones: availableDrones,
      totalDrones: fleetStatus.length,
      availableDrones: availableDrones.length,
      activeDeliveries: 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching available drones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get hive intelligence status
app.get('/api/hive/status', async (req, res) => {
  try {
    console.log('[API] Fetching hive intelligence status...');
    
    const hiveStatus = await droneSystem.getHiveIntelligence();
    
    res.json({
      success: true,
      hiveIntelligence: {
        status: hiveStatus.status || 'online',
        connectedDrones: hiveStatus.connectedDrones || 0,
        totalMissions: hiveStatus.totalMissions || 0,
        successRate: hiveStatus.successRate || 98.5,
        networkHealth: hiveStatus.networkHealth || 'optimal',
        aiModels: hiveStatus.activeModels || ['Navigation', 'Weather', 'Traffic', 'Security'],
        lastUpdate: new Date().toISOString(),
        insights: hiveStatus.insights || [
          'All drones operating within normal parameters',
          'Network conditions optimal for delivery',
          'AI models functioning correctly'
        ]
      }
    });
  } catch (error) {
    console.error('[API] Error fetching hive intelligence:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Allocate drone for delivery
app.post('/api/drones/allocate', async (req, res) => {
  try {
    const orderData = req.body;
    console.log('[API] Allocating drone for delivery:', orderData);
    
    // Use ElizaOS to find optimal drone
    const allocation = await droneSystem.allocateOptimalDrone(orderData);
    
    if (!allocation) {
      return res.status(404).json({
        success: false,
        error: 'No suitable drone available'
      });
    }

    res.json({
      success: true,
      allocatedDrone: {
        id: allocation.drone.id,
        name: allocation.drone.name,
        status: 'allocated',
        walletAddress: allocation.drone.walletAddress,
        estimatedPickupTime: allocation.timeline.pickup,
        estimatedDeliveryTime: allocation.timeline.delivery,
        batteryLevel: allocation.drone.batteryLevel,
        currentLocation: allocation.drone.location,
        route: allocation.route,
        aiStatus: allocation.aiStatus || 'Hive Intelligence Active - Route Optimized'
      }
    });
  } catch (error) {
    console.error('[API] Error allocating drone:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get drone wallet information
app.get('/api/drones/:droneId/wallet', async (req, res) => {
  try {
    const { droneId } = req.params;
    console.log(`[API] Fetching wallet info for drone ${droneId}...`);
    
    const walletInfo = await droneSystem.getDroneWallet(droneId);
    
    if (!walletInfo) {
      return res.status(404).json({
        success: false,
        error: 'Drone wallet not found'
      });
    }

    res.json({
      success: true,
      wallet: {
        address: walletInfo.address,
        balance: walletInfo.balance || '0',
        transactions: walletInfo.recentTransactions || [],
        escrowBalance: walletInfo.escrowBalance || '0'
      }
    });
  } catch (error) {
    console.error(`[API] Error fetching drone wallet ${req.params.droneId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add the missing API endpoints that the frontend expects
app.get('/api/drone/eliza-status', async (req, res) => {
  try {
    console.log('[API] Fetching ElizaOS status...');
    
    res.json({
      success: true,
      agent: "ElizaOS Drone Manager",
      droneStatus: "Active",
      network: "Sei Atlantic-2",
      uptime: "99.9%",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching ElizaOS status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/drone/hive-intelligence', async (req, res) => {
  try {
    console.log('[API] Fetching Hive Intelligence data...');
    
    const hiveData = await droneSystem.getHiveIntelligence();
    
    res.json({
      success: true,
      networkStatus: "Connected",
      routeOptimization: "Active",
      trafficAnalysis: "Real-time",
      weatherStatus: "Clear",
      fleetStatus: "Synchronized",
      droneWallet: hiveData.assignedDrone?.walletAddress || "0x742d35Cc6634C0532925a3b8D6Eb97E3Ba78A85A",
      score: hiveData.hiveScore || 0.95,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching Hive Intelligence:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/drone/info', async (req, res) => {
  try {
    console.log('[API] Fetching general drone info...');
    
    const droneInfo = await droneSystem.getFleetStatus();
    
    res.json({
      success: true,
      availableDrones: droneInfo.available || 15,
      averageDeliveryTime: "15-30 mins",
      deliveryRadius: "10km",
      successRate: "99.8%",
      walletAddress: "0x742d35Cc6634C0532925a3b8D6Eb97E3Ba78A85A",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching drone info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// New wallet-based transaction endpoints

// Get fund distribution info (instead of performing it)
app.post('/api/wallet/get-distribution-info', async (req, res) => {
  try {
    const { jobId, droneWallet, storeWallet, totalAmountSEI } = req.body;
    
    console.log(`[WALLET] Getting distribution info for job ${jobId}`);
    console.log(`[WALLET] Total amount: ${totalAmountSEI} SEI`);
    console.log(`[WALLET] Drone wallet: ${droneWallet}`);
    console.log(`[WALLET] Store wallet: ${storeWallet}`);
    
    // Calculate distribution (10% to drone, 90% to store)
    const totalAmountFloat = parseFloat(totalAmountSEI);
    const droneAmount = (totalAmountFloat * 0.10).toFixed(6); // 10% to drone
    const storeAmount = (totalAmountFloat * 0.90).toFixed(6);  // 90% to store
    
    const distributions = [];
    
    // Add drone distribution if valid
    if (droneWallet && droneWallet !== '0x0000000000000000000000000000000000000000') {
      distributions.push({
        address: droneWallet,
        amount: droneAmount,
        label: 'Drone Operator'
      });
    }
    
    // Add store distribution if valid
    if (storeWallet && storeWallet !== '0x0000000000000000000000000000000000000000') {
      distributions.push({
        address: storeWallet,
        amount: storeAmount,
        label: 'Store Owner'
      });
    }
    
    res.json({
      success: true,
      jobId,
      totalAmount: totalAmountSEI,
      distributions,
      breakdown: {
        drone: { percentage: '10%', amount: droneAmount },
        store: { percentage: '90%', amount: storeAmount }
      }
    });
    
  } catch (error) {
    console.error(`[WALLET] Error getting distribution info:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Confirm fund distribution completion
app.post('/api/wallet/confirm-distribution', async (req, res) => {
  try {
    const { jobId, transactions } = req.body;
    
    console.log(`[WALLET] Fund distribution confirmed for job ${jobId}`);
    console.log(`[WALLET] Transactions completed: ${transactions.length}`);
    
    transactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.label}: ${tx.amount} SEI to ${tx.address} (${tx.hash})`);
    });
    
    // Update job status
    jobStatus[jobId] = 'funds-distributed-wallet';
    
    res.json({
      success: true,
      jobId,
      message: 'Fund distribution confirmed',
      transactionCount: transactions.length
    });
    
  } catch (error) {
    console.error(`[WALLET] Error confirming distribution:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get drone assignment info for wallet signing
app.post('/api/wallet/get-drone-assignment', async (req, res) => {
  try {
    const { jobId } = req.body;
    
    const droneWallet = jobDroneWallets[jobId];
    
    if (!droneWallet) {
      return res.status(404).json({
        success: false,
        error: 'No drone assigned to this job'
      });
    }
    
    res.json({
      success: true,
      jobId,
      droneWallet,
      contractAddress: CONTRACT_ADDRESS
    });
    
  } catch (error) {
    console.error(`[WALLET] Error getting drone assignment:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add /postJob endpoint that the frontend expects
app.post('/postJob', async (req, res) => {
  try {
    const {
      senderLocation,
      receiverLocation,
      deliveryInstructions,
      escrowAmount,
      usdcAmount,
      items,
      customerWallet,
      shopOwnerWallet
    } = req.body;
    
    console.log(`[POSTJOB] Received order for drone delivery:`, req.body);
    
    // Generate a unique job ID
    const jobId = `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Process with ElizaOS drone management
    console.log(`[ELIZA] Processing delivery request with job ID: ${jobId}`);
    
    const droneAssignment = await droneSystem.processDeliveryConfirmation(jobId, {
      sender: customerWallet || "Unknown sender",
      recipient: shopOwnerWallet || "0xA50050DBDBe672a5F0261e403909bCB8590B9130",
      amount: escrowAmount || "0.1",
      details: deliveryInstructions || "Drone delivery service"
    });
    
    console.log(`[ELIZA] Drone assignment complete for job ${jobId}:`);
    console.log(`[ELIZA] Selected drone: ${droneAssignment.droneId}`);
    console.log(`[ELIZA] Drone wallet: ${droneAssignment.walletAddress}`);
    console.log(`[ELIZA] Hive intelligence score: ${droneAssignment.hiveScore.toFixed(3)}`);
    
    // Store job status and drone wallet
    jobStatus[jobId] = 'assigned';
    jobDroneWallets[jobId] = droneAssignment.walletAddress;
    
    // Simulate escrow contract interaction
    const escrowContractActive = true; // This should check actual contract status
    
    res.json({
      success: true,
      jobId: jobId,
      status: 'assigned',
      droneAssigned: droneAssignment.droneId,
      droneWallet: droneAssignment.walletAddress,
      estimatedDeliveryTime: new Date(Date.now() + droneAssignment.estimatedDeliveryTime * 60 * 1000).toISOString(),
      hiveIntelligence: {
        score: droneAssignment.hiveScore,
        networkStatus: "Connected",
        routeOptimization: "Active",
        trafficAnalysis: "Real-time",
        weatherStatus: "Clear",
        fleetStatus: "Synchronized",
        droneWallet: droneAssignment.walletAddress
      },
      elizaOS: {
        agent: "Active",
        droneStatus: "Dispatched",
        network: "Sei Atlantic-2",
        uptime: "99.9%",
        version: "1.0.0"
      },
      escrowContract: {
        active: escrowContractActive,
        contractAddress: CONTRACT_ADDRESS,
        customerWallet: customerWallet,
        shopOwnerWallet: shopOwnerWallet,
        escrowAmount: escrowAmount
      },
      trackingInfo: {
        pickupETA: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        deliveryETA: new Date(Date.now() + droneAssignment.estimatedDeliveryTime * 60 * 1000).toISOString()
      }
    });
    
  } catch (error) {
    console.error('[POSTJOB] Error processing delivery request:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to process drone delivery request'
    });
  }
});

// New endpoint for creating escrow jobs via smart contract
app.post('/api/drone/create-escrow-job', async (req, res) => {
  try {
    const {
      jobDetails,
      recipientAddress,
      senderAddress,
      amount,
      microSeiAmount,
      transactionHash,
      deliveryDetails,
      orderData
    } = req.body;
    
    console.log(`[ESCROW] Creating escrow job for transaction: ${transactionHash}`);
    console.log(`[ESCROW] Job details: ${jobDetails}`);
    console.log(`[ESCROW] Amount: ${amount} SEI (${microSeiAmount} microSEI)`);
    console.log(`[ESCROW] From: ${senderAddress} To: ${recipientAddress}`);
    
    try {
      // Call the smart contract to create the escrow job
      console.log(`[ESCROW] Calling DeliveryEscrow.postJob() on contract ${CONTRACT_ADDRESS}`);
      
      // Convert amount to Wei (microSEI)
      const weiAmount = ethers.parseEther(amount.toString());
      
      // Convert Sei bech32 address to Ethereum hex format for contract compatibility
      let contractRecipientAddress = recipientAddress;
      
      // If it's a Sei bech32 address, use a default hex address for contract
      if (recipientAddress.startsWith('sei1')) {
        console.log(`[ESCROW] Converting Sei bech32 address ${recipientAddress} to hex format for contract`);
        // Use shop owner's Ethereum address instead
        contractRecipientAddress = "0xA50050DBDBe672a5F0261e403909bCB8590B9130"; // Shop owner hex address
      }
      
      console.log(`[ESCROW] Using contract recipient address: ${contractRecipientAddress}`);
      
      // Call the contract's postJob function
      const tx = await contract.postJob(
        jobDetails,
        contractRecipientAddress,
        { value: weiAmount }
      );
      
      console.log(`[ESCROW] Contract transaction submitted: ${tx.hash}`);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log(`[ESCROW] Contract transaction confirmed in block: ${receipt.blockNumber}`);
      
      // Extract job ID from the contract event logs
      let contractJobId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          if (parsed && parsed.name === 'JobPosted') {
            contractJobId = parsed.args.jobId.toString();
            console.log(`[ESCROW] Contract job ID: ${contractJobId}`);
            break;
          }
        } catch (logError) {
          // Ignore unparseable logs
        }
      }
      
      // Generate local job ID for tracking
      const localJobId = `ESCROW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Process with ElizaOS drone management
      console.log(`[ELIZA] Processing escrow delivery request with job ID: ${localJobId}`);
      
      const droneAssignment = await droneSystem.processDeliveryConfirmation(localJobId, {
        sender: senderAddress,
        recipient: recipientAddress,
        amount: amount.toString(),
        details: jobDetails
      });
      
      console.log(`[ELIZA] Drone assignment complete for escrow job ${localJobId}:`);
      console.log(`[ELIZA] Selected drone: ${droneAssignment.droneId}`);
      console.log(`[ELIZA] Drone wallet: ${droneAssignment.walletAddress}`);
      console.log(`[ELIZA] Hive intelligence score: ${droneAssignment.hiveScore.toFixed(3)}`);
      
      // Store job status and drone wallet
      jobStatus[localJobId] = 'escrow-funded';
      jobDroneWallets[localJobId] = droneAssignment.walletAddress;
      
      // If contract supports drone assignment, assign the drone
      const contractSupport = await checkContractSupport();
      if (contractSupport && contractJobId && droneAssignment.walletAddress) {
        try {
          console.log(`[ESCROW] Assigning drone ${droneAssignment.walletAddress} to contract job ${contractJobId}`);
          const assignTx = await contract.assignDrone(contractJobId, droneAssignment.walletAddress);
          await assignTx.wait();
          console.log(`[ESCROW] Drone successfully assigned to contract job`);
        } catch (assignError) {
          // Suppressed error log for failed drone assignment to contract
        }
      }

      // Note: Fund distribution will now be handled by frontend wallet
      console.log(`[ESCROW] Job created successfully. Fund distribution will be handled by connected wallet.`);
      console.log(`[ESCROW] Frontend should call /api/wallet/get-distribution-info to get payment details`);
      
      // Store the job info for wallet-based distribution
      jobDroneWallets[localJobId] = droneAssignment.walletAddress;

      // Escrow split logic: 90% to store, 10% to drone
      try {
        const totalAmountWei = ethers.parseEther(amount.toString());
        const droneAmountWei = (totalAmountWei * 10n) / 100n;
        const storeAmountWei = totalAmountWei - droneAmountWei;
        const storeWallet = process.env.STORE_WALLET || "sei1884g9d7kruxenr3zv8gysc8uh05acp3mcdykke";
        const droneWallet = droneAssignment.walletAddress;

        // Send 10% to drone wallet
        if (droneAmountWei > 0n) {
          try {
            const payoutTx = await wallet.sendTransaction({ to: droneWallet, value: droneAmountWei });
            await payoutTx.wait();
            console.log(`[ESCROW] Sent ${ethers.formatEther(droneAmountWei)} SEI to drone wallet ${droneWallet}`);
          } catch (err) {
            console.error(`[ESCROW] Failed to send payout to drone wallet:`, err);
          }
        }
        // Send 90% to store wallet
        if (storeAmountWei > 0n) {
          try {
            const payoutTx = await wallet.sendTransaction({ to: storeWallet, value: storeAmountWei });
            await payoutTx.wait();
            console.log(`[ESCROW] Sent ${ethers.formatEther(storeAmountWei)} SEI to store wallet ${storeWallet}`);
          } catch (err) {
            console.error(`[ESCROW] Failed to send payout to store wallet:`, err);
          }
        }
      } catch (splitErr) {
        console.error(`[ESCROW] Error in escrow split:`, splitErr);
      }

      res.json({
        success: true,
        localJobId: localJobId,
        contractJobId: contractJobId,
        contractTxHash: tx.hash,
        paymentTxHash: transactionHash,
        blockNumber: receipt.blockNumber,
        droneAssigned: droneAssignment.droneId,
        droneWallet: droneAssignment.walletAddress,
        estimatedDeliveryTime: new Date(Date.now() + droneAssignment.estimatedDeliveryTime * 60 * 1000).toISOString(),
        escrowContract: {
          active: true,
          contractAddress: CONTRACT_ADDRESS,
          jobId: contractJobId,
          amount: amount,
          microSeiAmount: microSeiAmount,
          status: 'funded'
        },
        hiveIntelligence: {
          score: droneAssignment.hiveScore,
          networkStatus: "Connected",
          routeOptimization: "Active",
          trafficAnalysis: "Real-time",
          weatherStatus: "Clear",
          fleetStatus: "Synchronized",
          droneWallet: droneAssignment.walletAddress
        },
        elizaOS: {
          agent: "Active",
          droneStatus: "Dispatched",
          network: "Sei Atlantic-2",
          uptime: "99.9%",
          version: "1.0.0"
        },
        trackingInfo: {
          pickupETA: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          deliveryETA: new Date(Date.now() + droneAssignment.estimatedDeliveryTime * 60 * 1000).toISOString()
        }
      });
      
    } catch (contractError) {
      console.error('[ESCROW] Smart contract interaction failed:', contractError);
      
      // Fallback: still process as regular delivery job
      const fallbackJobId = `FALLBACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const droneAssignment = await droneSystem.processDeliveryConfirmation(fallbackJobId, {
        sender: senderAddress,
        recipient: recipientAddress,
        amount: amount.toString(),
        details: jobDetails
      });
      
      jobStatus[fallbackJobId] = 'payment-received';
      jobDroneWallets[fallbackJobId] = droneAssignment.walletAddress;
      
      res.json({
        success: true,
        localJobId: fallbackJobId,
        contractJobId: null,
        paymentTxHash: transactionHash,
        droneAssigned: droneAssignment.droneId,
        droneWallet: droneAssignment.walletAddress,
        estimatedDeliveryTime: new Date(Date.now() + droneAssignment.estimatedDeliveryTime * 60 * 1000).toISOString(),
        escrowContract: {
          active: false,
          error: contractError.message,
          fallbackMode: true
        },
        warning: 'Escrow contract interaction failed, processing as direct payment',
        hiveIntelligence: {
          score: droneAssignment.hiveScore,
          networkStatus: "Connected",
          routeOptimization: "Active",
          trafficAnalysis: "Real-time",
          weatherStatus: "Clear",
          fleetStatus: "Synchronized",
          droneWallet: droneAssignment.walletAddress
        },
        elizaOS: {
          agent: "Active",
          droneStatus: "Dispatched",
          network: "Sei Atlantic-2",
          uptime: "99.9%",
          version: "1.0.0"
        }
      });
    }
    
  } catch (error) {
    console.error('[ESCROW] Error creating escrow job:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create escrow job'
    });
  }
});

app.listen(3001, '0.0.0.0', () => {
  console.log('Backend server running on http://127.0.0.1:3001');
  console.log('🔗 SEI blockchain integration active');
  console.log('🧠 ElizaOS hive intelligence enabled');
  console.log('🚁 Drone management system initialized');
});

// Post a new job
async function postJob(details, recipient, amountEth) {
  const tx = await contract.postJob(details, recipient, { value: ethers.parseEther(amountEth) });
  await tx.wait();
  console.log("Job posted!");
}

// Confirm completion
async function confirmDelivery(jobId) {
  const tx = await contract.confirmDelivery(jobId);
  await tx.wait();
  console.log("Delivery confirmed!");
}

// Example usage
// postJob("Deliver package to Alice", "0xRecipientAddress", "0.1");
// confirmDelivery(1);
