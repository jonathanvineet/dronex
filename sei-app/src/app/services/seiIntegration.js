// Service for integrating with Sei-SO backend
import { convertUsdcToSei } from '@/app/data/product';
import compassWalletService from '@/services/compassWalletService';

// Default backend URL - should be configured based on environment
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Sei blockchain configuration
const SEI_CONFIG = {
  chainId: 'atlantic-2',
  rpcUrl: 'https://rpc.atlantic-2.seinetwork.io/',
  contractAddress: '0x233D7487e447248DF9f71C6db46e8454254EB808' // DeliveryEscrow contract address
};

// DeliveryEscrow Contract ABI (essential functions only)
const DELIVERY_ESCROW_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "details", "type": "string"},
      {"internalType": "address", "name": "recipient", "type": "address"}
    ],
    "name": "postJob",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "jobId", "type": "uint256"}],
    "name": "confirmDelivery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "jobs",
    "outputs": [
      {"internalType": "address", "name": "poster", "type": "address"},
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "address", "name": "feeWallet", "type": "address"},
      {"internalType": "address", "name": "droneWallet", "type": "address"},
      {"internalType": "string", "name": "details", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bool", "name": "funded", "type": "bool"},
      {"internalType": "bool", "name": "completed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Convert cart items to Sei amounts and prepare for blockchain transaction
 */
export const prepareOrderForSei = (cartItems) => {
  const orderData = {
    items: cartItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      usdcPrice: item.price,
      seiPrice: convertUsdcToSei(item.price),
      totalSeiAmount: convertUsdcToSei(item.price * item.quantity)
    })),
    totalUsdcAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    totalSeiAmount: 0
  };
  
  orderData.totalSeiAmount = convertUsdcToSei(orderData.totalUsdcAmount);
  
  return orderData;
};

/**
 * Submit order to Sei-SO backend for drone delivery processing
 */
export const submitDroneDeliveryOrder = async (orderData, deliveryDetails) => {
  try {
    const droneJobData = {
      // Product details
      senderLocation: deliveryDetails.pickupAddress || "Sei Delivery Hub", // Default pickup location
      receiverLocation: deliveryDetails.deliveryAddress,
      deliveryInstructions: deliveryDetails.instructions || "Standard delivery",
      
      // Financial details
      escrowAmount: orderData.totalSeiAmount,
      usdcAmount: orderData.totalUsdcAmount,
      items: orderData.items,
      
      // Additional metadata
      orderType: "product_delivery",
      priority: "standard",
      timestamp: new Date().toISOString(),
      
      // Wallet information
      customerWallet: deliveryDetails.walletAddress,
      shopOwnerWallet: deliveryDetails.shopOwnerWallet || "0xA50050DBDBe672a5F0261e403909bCB8590B9130",
      
      // Distance and fees (will be calculated by backend)
      estimatedDistance: null,
      baseFee: null,
      totalFee: null
    };

    // Call the internal API endpoint which interfaces with sei-so backend
    const response = await fetch('/api/drone/postJob', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(droneJobData)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Error submitting drone delivery order:', error);
    throw error;
  }
};

/**
 * Connect to Sei wallet via Compass wallet service
 */
export const connectSeiWallet = async () => {
  try {
    console.log('🧭 Connecting to Sei wallet via Compass wallet service...');
    
    if (!compassWalletService.isCompassAvailable()) {
      throw new Error('Compass wallet not found. Please install Compass, Keplr, or Leap wallet extension.');
    }
    
    const result = await compassWalletService.connectWallet();
    
    if (result.isConnected) {
      console.log(`✅ Connected to ${result.wallet}: ${result.address}`);
      return result;
    } else {
      throw new Error('Failed to connect to Compass wallet');
    }
    
  } catch (error) {
    console.error('❌ Compass wallet connection failed:', error);
    throw error;
  }
};

/**
 * Check if wallet is already connected
 */
export const isWalletConnected = () => {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem('seiWalletConnection');
  if (!stored) return false;
  
  try {
    const connection = JSON.parse(stored);
    // Check if connection is recent (within 24 hours)
    const isRecent = (Date.now() - connection.timestamp) < (24 * 60 * 60 * 1000);
    
    if (connection.isConnected && isRecent && (window.sei || window.ethereum)) {
      return connection;
    }
  } catch (e) {
    console.error('Error parsing stored wallet connection:', e);
  }
  
  return false;
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = () => {
  localStorage.removeItem('seiWalletConnection');
  console.log('Sei wallet disconnected');
};

/**
 * Execute payment on Sei blockchain using DeliveryEscrow smart contract
 */
export const executeSeiPayment = async (orderData, walletAddress, deliveryDetails = {}) => {
  try {
    console.log('🗺️ Executing SEI payment via Compass wallet service and DeliveryEscrow contract:', { orderData, walletAddress });
    
    // Ensure Compass wallet is connected
    const connectionInfo = compassWalletService.getConnectionInfo();
    if (!connectionInfo.isConnected) {
      console.log('🗺️ No active connection, attempting to connect...');
      await compassWalletService.connectWallet();
    }
    
    // Get the connected address
    const connectedInfo = compassWalletService.getConnectionInfo();
    const senderAddress = connectedInfo.address;
    
    if (!senderAddress) {
      throw new Error('No wallet address available');
    }
    
    console.log('✅ Using Compass wallet address:', senderAddress);
    
    // Shop owner wallet (recipient) - EVM address format for Sei EVM
    const shopOwnerWallet = "0xA50050DBDBe672a5F0261e403909bCB8590B9130"; // EVM address format
    
  // Always send exactly 0.001 SEI for payment
  const seiAmountFloat = 0.001;
  const cappedSeiAmount = 0.001;

  const weiAmount = BigInt(Math.floor(seiAmountFloat * Math.pow(10, 18))).toString(16);
  const cappedWeiAmount = BigInt(Math.floor(cappedSeiAmount * Math.pow(10, 18))).toString(16);

  console.log(`Creating EVM transaction with original ${seiAmountFloat} SEI (${weiAmount} Wei) but sending capped ${cappedSeiAmount} SEI (${cappedWeiAmount} Wei) from ${senderAddress} to ${shopOwnerWallet}`);
    
    // Prepare job details for smart contract
    const jobDetails = `DroneX Delivery: ${orderData.items.map(item => `${item.quantity}x ${item.name}`).join(', ')} | Address: ${deliveryDetails.deliveryAddress || 'Standard delivery'}`;
    
    try {
      console.log('📝 Posting job to smart contract via Compass wallet service...');
      console.log('Job details:', {
        details: jobDetails,
        recipient: shopOwnerWallet,
        amount: `${cappedSeiAmount} SEI`
      });
      
      // Use Compass wallet service to post job to contract
      const contractResult = await compassWalletService.postJobToContract(
        jobDetails,
        shopOwnerWallet,
        cappedSeiAmount
      );
      
      if (!contractResult.success) {
        throw new Error('Failed to post job to smart contract');
      }
      
      console.log('✅ Job posted to contract successfully:', contractResult);
      
      const txHash = contractResult.txHash;
      const jobId = contractResult.jobId;
      const receipt = {
        blockNumber: contractResult.blockNumber ? `0x${contractResult.blockNumber.toString(16)}` : null,
        gasUsed: contractResult.gasUsed ? `0x${contractResult.gasUsed.toString(16)}` : null,
        status: '0x1' // Success
      };
      
      // Now call backend to create the escrow job in the smart contract
      try {
        console.log('Creating escrow job via backend...');
        
        const backendResponse = await fetch(`${BACKEND_URL}/api/drone/create-escrow-job`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobDetails: jobDetails,
            recipientAddress: shopOwnerWallet,
            senderAddress: senderAddress,
            // recorded amount remains the original order amount (for records/escrow)
            amount: seiAmountFloat,
            // actual on-chain payment amount (capped to < 1 SEI)
            paymentAmount: cappedSeiAmount,
            transactionHash: txHash,
            deliveryDetails: deliveryDetails,
            orderData: orderData
          })
        });
        
        if (!backendResponse.ok) {
          console.error('Backend escrow job creation failed:', await backendResponse.text());
          // Continue anyway as the payment went through
        } else {
          const escrowJobResult = await backendResponse.json();
          console.log('Escrow job created successfully:', escrowJobResult);
        }
        
      } catch (backendError) {
        console.error('Failed to create escrow job via backend:', backendError);
        // Continue anyway as the payment went through
      }
      
      return {
        success: true,
        transactionHash: txHash,
        blockHeight: receipt ? parseInt(receipt.blockNumber, 16) : Math.floor(Math.random() * 1000000) + 2000000,
        gasUsed: receipt ? parseInt(receipt.gasUsed, 16) : Math.floor(Math.random() * 100000) + 50000,
        timestamp: new Date().toISOString(),
        seiAmount: seiAmountFloat,
        fromAddress: senderAddress,
        toAddress: shopOwnerWallet,
        recipientAddress: shopOwnerWallet,
        walletType: window.sei ? 'sei-wallet' : 'metamask',
        contractInteraction: true,
        jobDetails: jobDetails
      };
      
    } catch (signError) {
      console.error('Transaction signing/broadcasting failed:', signError);
      
      // Handle user rejection
      if (signError.message && (
        signError.message.includes('rejected') || 
        signError.message.includes('denied') ||
        signError.message.includes('cancelled') ||
        signError.message.includes('Request rejected') ||
        signError.message.includes('User rejected')
      )) {
        throw new Error('Transaction was rejected by user. Please approve the transaction in your wallet to proceed.');
      }
      
      // Handle insufficient funds
      if (signError.message && signError.message.includes('insufficient')) {
        throw new Error('Insufficient SEI balance. Please add more SEI to your wallet.');
      }
      
      throw new Error(`Payment failed: ${signError.message || 'Transaction error'}`);
    }
    
  } catch (error) {
    console.error('Error executing SEI escrow payment:', error);
    throw error;
  }
};

/**
 * Get current SEI/USDC exchange rate (in production, this would fetch from an API)
 */
export const getSeiExchangeRate = async () => {
  try {
    // In production, fetch from a real API like CoinGecko or similar
    // For now, return the hardcoded rate from the products file
    return {
      usdcToSei: 3.12,
      seiToUsdc: 0.04,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Return default rate as fallback
    return {
      usdcToSei: 3.12,
      seiToUsdc: 0.04,
      timestamp: new Date().toISOString()
    };
  }
};

const seiService = {
  prepareOrderForSei,
  submitDroneDeliveryOrder,
  connectSeiWallet,
  executeSeiPayment,
  getSeiExchangeRate,
  SEI_CONFIG
};

export default seiService;
