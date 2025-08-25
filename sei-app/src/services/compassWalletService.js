"use client";

import { SigningStargateClient } from "@cosmjs/stargate";
import { fromBech32, toBech32 } from "@cosmjs/encoding";

// Sei blockchain configuration
const SEI_CONFIG = {
  chainId: process.env.NEXT_PUBLIC_SEI_CHAIN_ID || "atlantic-2",
  rpc: process.env.NEXT_PUBLIC_SEI_RPC || "https://rpc.atlantic-2.seinetwork.io/",
  denom: process.env.NEXT_PUBLIC_SEI_DENOM || "usei",
  prefix: "sei",
  decimals: 6,
  // EVM config for Compass
  evmChainId: "0x530", // 1328 in hex (Sei EVM Testnet)
  evmRpc: "https://evm-rpc-testnet.sei-apis.com"
};

// Smart contract configuration
const CONTRACT_CONFIG = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x233D7487e447248DF9f71C6db46e8454254EB808",
  abi: [
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
      "inputs": [
        {"internalType": "uint256", "name": "jobId", "type": "uint256"},
        {"internalType": "address", "name": "droneWallet", "type": "address"}
      ],
      "name": "assignDrone",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "uint256", "name": "jobId", "type": "uint256"},
        {"indexed": true, "internalType": "address", "name": "customer", "type": "address"},
        {"indexed": false, "internalType": "string", "name": "details", "type": "string"},
        {"indexed": false, "internalType": "address", "name": "recipient", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "JobPosted",
      "type": "event"
    }
  ]
};

class CompassWalletService {
  constructor() {
    this.isConnected = false;
    this.address = null;
    this.cosmosClient = null;
    this.evmProvider = null;
    this.balance = null;
    this.chainId = SEI_CONFIG.chainId;
  }

  /**
   * Check if Compass wallet is available
   */
  isCompassAvailable() {
    return typeof window !== "undefined" && (
      window.compass || 
      window.keplr || 
      window.leap
    );
  }

  /**
   * Get the active Compass wallet provider
   */
  getCompassProvider() {
    if (typeof window === "undefined") return null;
    
    // Prioritize Compass, then Leap, then Keplr
    if (window.compass) return { provider: window.compass, name: "Compass" };
    if (window.leap) return { provider: window.leap, name: "Leap" };  
    if (window.keplr) return { provider: window.keplr, name: "Keplr" };
    
    return null;
  }

  /**
   * Connect to Compass wallet
   */
  async connectWallet() {
    try {
      const compassProvider = this.getCompassProvider();
      
      if (!compassProvider) {
        throw new Error("Compass wallet not found. Please install Compass wallet extension.");
      }

      console.log(`Connecting to ${compassProvider.name} wallet...`);
      
      // Enable the chain
      try {
        await compassProvider.provider.enable(this.chainId);
      } catch (enableError) {
        if (compassProvider.provider.experimentalSuggestChain) {
          await this.suggestSeiChain(compassProvider.provider);
          await compassProvider.provider.enable(this.chainId);
        } else {
          throw new Error("Failed to enable Sei chain in wallet");
        }
      }

      // Get account info
      const key = await compassProvider.provider.getKey(this.chainId);
      
      if (!key || !key.bech32Address) {
        throw new Error("Failed to get account from wallet");
      }

      this.address = key.bech32Address;
      this.isConnected = true;

      // Initialize signing client for Cosmos transactions
      const offlineSigner = compassProvider.provider.getOfflineSigner(this.chainId);
      this.cosmosClient = await SigningStargateClient.connectWithSigner(
        SEI_CONFIG.rpc,
        offlineSigner
      );

      // Set up EVM provider - try multiple approaches
      this.evmProvider = null;
      
      // Method 1: Check for ethereum provider directly
      if (compassProvider.provider.ethereum) {
        this.evmProvider = compassProvider.provider.ethereum;
        console.log('✅ Found EVM provider via ethereum property');
      }
      // Method 2: Check if the provider itself has EVM methods
      else if (compassProvider.provider.request) {
        this.evmProvider = compassProvider.provider;
        console.log('✅ Using provider directly for EVM calls');
      }
      // Method 3: Check window.ethereum as fallback
      else if (typeof window !== 'undefined' && window.ethereum) {
        this.evmProvider = window.ethereum;
        console.log('✅ Using window.ethereum as EVM provider');
      }
      
      if (this.evmProvider) {
        try {
          // Try to switch to Sei EVM network
          await this.evmProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEI_CONFIG.evmChainId }],
          });
          console.log('✅ Switched to Sei EVM network');
        } catch (switchError) {
          console.log('Network switch error:', switchError);
          if (switchError.code === 4902) {
            try {
              await this.addSeiEvmNetwork();
              console.log('✅ Added Sei EVM network');
            } catch (addError) {
              console.error('Failed to add Sei EVM network:', addError);
            }
          }
        }
      } else {
        console.warn('⚠️ No EVM provider found - EVM transactions may not work');
      }

      // Fetch balance
      await this.updateBalance();

      // Store connection info
      localStorage.setItem('compassWalletConnection', JSON.stringify({
        isConnected: true,
        address: this.address,
        wallet: compassProvider.name.toLowerCase(),
        timestamp: Date.now()
      }));

      console.log(`✅ Connected to ${compassProvider.name}: ${this.address}`);
      
      return {
        address: this.address,
        balance: this.balance,
        wallet: compassProvider.name.toLowerCase(),
        isConnected: true
      };

    } catch (error) {
      console.error("❌ Compass wallet connection failed:", error);
      throw error;
    }
  }

  /**
   * Suggest Sei chain to wallet
   */
  async suggestSeiChain(provider) {
    const chainInfo = {
      chainId: this.chainId,
      chainName: "Sei Atlantic Testnet",
      rpc: SEI_CONFIG.rpc,
      rest: "https://sei-testnet-api.polkachu.com",
      bip44: { coinType: 118 },
      bech32Config: {
        bech32PrefixAccAddr: "sei",
        bech32PrefixAccPub: "seipub",
        bech32PrefixValAddr: "seivaloper",
        bech32PrefixValPub: "seivaloperpub",
        bech32PrefixConsAddr: "seivalcons",
        bech32PrefixConsPub: "seivalconspub"
      },
      currencies: [{
        coinDenom: "SEI",
        coinMinimalDenom: "usei",
        coinDecimals: 6
      }],
      feeCurrencies: [{
        coinDenom: "SEI",
        coinMinimalDenom: "usei",
        coinDecimals: 6,
        gasPriceStep: { low: 0.02, average: 0.025, high: 0.04 }
      }],
      stakeCurrency: {
        coinDenom: "SEI",
        coinMinimalDenom: "usei",
        coinDecimals: 6
      },
      features: ["stargate", "ibc-transfer"]
    };

    await provider.experimentalSuggestChain(chainInfo);
  }

  /**
   * Add Sei EVM network to wallet
   */
  async addSeiEvmNetwork() {
    if (!this.evmProvider) return;
    
    await this.evmProvider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: SEI_CONFIG.evmChainId,
        chainName: 'Sei EVM Testnet',
        rpcUrls: [SEI_CONFIG.evmRpc],
        nativeCurrency: {
          name: 'Sei',
          symbol: 'SEI',
          decimals: 18,
        },
        blockExplorerUrls: ['https://seitrace.com'],
      }],
    });
  }

  /**
   * Update wallet balance
   */
  async updateBalance() {
    if (!this.isConnected || !this.address) return;

    try {
      if (this.cosmosClient) {
        const balance = await this.cosmosClient.getBalance(this.address, SEI_CONFIG.denom);
        this.balance = parseFloat(balance.amount) / Math.pow(10, SEI_CONFIG.decimals);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      this.balance = 0;
    }

    return this.balance;
  }

  /**
   * Send SEI tokens via Cosmos
   */
  async sendSei(toAddress, amount, memo = "") {
    if (!this.isConnected || !this.cosmosClient) {
      throw new Error("Wallet not connected");
    }

    try {
      const amountInMicroSei = Math.floor(amount * Math.pow(10, SEI_CONFIG.decimals));
      
      const fee = {
        amount: [{ denom: SEI_CONFIG.denom, amount: "20000" }], // 0.02 SEI fee
        gas: "200000"
      };

      const result = await this.cosmosClient.sendTokens(
        this.address,
        toAddress,
        [{ denom: SEI_CONFIG.denom, amount: amountInMicroSei.toString() }],
        fee,
        memo
      );

      console.log("✅ SEI transfer successful:", result.transactionHash);
      
      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed,
        success: true
      };

    } catch (error) {
      console.error("❌ SEI transfer failed:", error);
      throw error;
    }
  }

  /**
   * Post job to smart contract via EVM using ethers, with Cosmos fallback
   */
  async postJobToContract(details, recipientAddress, amountSei) {
    console.log('📝 postJobToContract called with:', {
      details,
      recipientAddress,
      amountSei,
      isConnected: this.isConnected,
      hasEvmProvider: !!this.evmProvider,
      address: this.address
    });
    
    if (!this.isConnected) {
      console.error('❌ Wallet not connected in postJobToContract');
      throw new Error("Wallet not connected");
    }
    
    // If EVM provider is not available, use Cosmos transaction as fallback
    if (!this.evmProvider) {
      console.warn('⚠️ EVM provider not available, using Cosmos transaction fallback');
      return await this.postJobViaCosmosTransfer(details, recipientAddress, amountSei);
    }

    try {
      // Import ethers dynamically
      const { ethers } = await import('ethers');
      
      // Convert address to EVM format if it's bech32
      let evmRecipient = recipientAddress;
      if (recipientAddress.startsWith('sei')) {
        const { data } = fromBech32(recipientAddress);
        evmRecipient = '0x' + Buffer.from(data).toString('hex');
      }

      // Create ethers provider and signer
      const provider = new ethers.BrowserProvider(this.evmProvider);
      const signer = await provider.getSigner();
      
      console.log("Using signer address:", await signer.getAddress());
      
      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
      
      // Convert amount to Wei (18 decimals for EVM)
      const amountWei = ethers.parseEther(amountSei.toString());
      
      console.log("Posting job to smart contract:", {
        details,
        recipient: evmRecipient,
        amount: `${amountSei} SEI`,
        amountWei: amountWei.toString(),
        contractAddress: CONTRACT_CONFIG.address,
        signerAddress: await signer.getAddress()
      });
      
      // Validate inputs before contract call
      if (!details || typeof details !== 'string') {
        throw new Error('Details must be a non-empty string');
      }
      if (!evmRecipient || !evmRecipient.startsWith('0x') || evmRecipient.length !== 42) {
        throw new Error('Invalid recipient address format');
      }
      if (amountSei <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Get current gas price from network
      let gasPrice;
      try {
        const feeData = await provider.getFeeData();
        gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei'); // Fallback to 50 Gwei
      } catch (e) {
        console.warn('Could not fetch gas price, using default');
        gasPrice = ethers.parseUnits('50', 'gwei'); // Higher default for Sei EVM
      }
      
      // Call postJob function with dynamic gas price
      console.log('⚡ About to call contract.postJob with:', {
        gasLimit: 150000,
        gasPrice: gasPrice?.toString(),
        value: amountWei?.toString()
      });
      
      const tx = await contract.postJob(details, evmRecipient, {
        value: amountWei,
        gasLimit: 150000, // Higher gas limit for safety
        gasPrice: gasPrice
      });

      console.log("✅ Transaction sent:", tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt);

      // Extract job ID from logs
      let jobId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          // Parse logs to find JobPosted event
          for (const log of receipt.logs) {
            try {
              const parsedLog = contract.interface.parseLog({
                topics: log.topics,
                data: log.data
              });
              
              if (parsedLog && parsedLog.name === 'JobPosted') {
                jobId = parsedLog.args.jobId.toString();
                console.log("✅ Job ID extracted:", jobId);
                break;
              }
            } catch (parseError) {
              console.debug("Could not parse log:", parseError);
            }
          }
        } catch (logError) {
          console.error("Error parsing logs:", logError);
        }
      }

      return {
        txHash: receipt.hash,
        jobId,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        success: true
      };

    } catch (error) {
      console.error("❌ Contract interaction failed:", error);
      
      // Better error messages
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (error.message?.includes('execution reverted')) {
        throw new Error('Contract execution failed - check transaction requirements');
      }
      
      throw error;
    }
  }

  /**
   * Fallback method: Post job via Cosmos transfer when EVM is not available
   */
  async postJobViaCosmosTransfer(details, recipientAddress, amountSei) {
    console.log('🔄 Using Cosmos transaction fallback for job posting');
    
    try {
      // Create memo with job details
      const memo = JSON.stringify({
        type: 'job_posting',
        details: details,
        recipient: recipientAddress,
        amount: amountSei,
        timestamp: Date.now()
      });

      // Send SEI tokens with memo containing job details
      const result = await this.sendSei(recipientAddress, amountSei, memo);
      
      // Generate a pseudo job ID from transaction hash
      const jobId = result.txHash ? `cosmos-${result.txHash.slice(-8)}` : `cosmos-${Date.now()}`;
      
      console.log('✅ Job posted via Cosmos transfer:', {
        txHash: result.txHash,
        jobId,
        details,
        recipient: recipientAddress,
        amount: amountSei
      });

      return {
        txHash: result.txHash,
        jobId,
        blockNumber: result.height,
        gasUsed: result.gasUsed,
        success: true,
        method: 'cosmos_transfer'
      };
    } catch (error) {
      console.error('❌ Cosmos fallback transaction failed:', error);
      throw error;
    }
  }

  /**
   * Confirm delivery on smart contract
   */
  async confirmDelivery(jobId) {
    if (!this.evmProvider) {
      throw new Error("EVM provider not available");
    }

    try {
      const accounts = await this.evmProvider.request({ method: 'eth_accounts' });
      const evmAddress = accounts[0];

      // Encode confirmDelivery function call
      const functionSelector = "0xfd84cb97"; // confirmDelivery function selector
      const encodedJobId = jobId.toString(16).padStart(64, '0');
      const data = functionSelector + encodedJobId;

      const txParams = {
        from: evmAddress,
        to: CONTRACT_CONFIG.address,
        data: data,
        gas: '0x9c40', // 40000 gas
        gasPrice: '0x9502f9000' // 40 Gwei
      };

      const txHash = await this.evmProvider.request({
        method: 'eth_sendTransaction',
        params: [txParams]
      });

      console.log("✅ Delivery confirmed:", txHash);

      return {
        txHash,
        success: true
      };

    } catch (error) {
      console.error("❌ Delivery confirmation failed:", error);
      throw error;
    }
  }


  /**
   * Get wallet connection info
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      address: this.address,
      balance: this.balance,
      chainId: this.chainId
    };
  }

  /**
   * Check if wallet is already connected
   */
  async checkExistingConnection() {
    const stored = localStorage.getItem('compassWalletConnection');
    if (!stored) return false;

    try {
      const connection = JSON.parse(stored);
      const isRecent = (Date.now() - connection.timestamp) < (24 * 60 * 60 * 1000);
      
      if (connection.isConnected && isRecent && this.isCompassAvailable()) {
        console.log('🔄 Attempting to restore wallet connection...');
        // Try to restore connection
        try {
          await this.connectWallet();
          console.log('✅ Wallet connection restored successfully');
          return true;
        } catch (e) {
          console.log("❌ Could not restore wallet connection:", e.message);
          // Clear invalid stored connection
          localStorage.removeItem('compassWalletConnection');
          return false;
        }
      } else {
        console.log('🗺️ Stored connection is expired or invalid');
        // Clear expired connection
        localStorage.removeItem('compassWalletConnection');
      }
    } catch (e) {
      console.error("Error checking existing connection:", e);
      // Clear corrupted stored connection
      localStorage.removeItem('compassWalletConnection');
    }

    return false;
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.isConnected = false;
    this.address = null;
    this.cosmosClient = null;
    this.evmProvider = null;
    this.balance = null;
    
    localStorage.removeItem('compassWalletConnection');
    console.log("👋 Compass wallet disconnected");
  }
}

// Create singleton instance
const compassWalletService = new CompassWalletService();

export default compassWalletService;
