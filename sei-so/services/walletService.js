// services/walletService.js
import { ethers } from 'ethers';

const CONTRACT_ABI = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":true,"internalType":"address","name":"feeWallet","type":"address"},{"indexed":false,"internalType":"uint256","name":"recipientAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"feeAmount","type":"uint256"}],"name":"JobCompleted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"JobFunded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":true,"internalType":"address","name":"poster","type":"address"},{"indexed":false,"internalType":"string","name":"details","type":"string"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"address","name":"feeWallet","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"JobPosted","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"jobId","type":"uint256"}],"name":"confirmDelivery","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"jobCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"jobs","outputs":[{"internalType":"address","name":"poster","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"address","name":"feeWallet","type":"address"},{"internalType":"string","name":"details","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"funded","type":"bool"},{"internalType":"bool","name":"completed","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"string","name":"details","type":"string"},{"internalType":"address","name":"recipient","type":"address"}],"name":"postJob","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"FEE_WALLET","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"jobId","type":"uint256"},{"internalType":"address","name":"droneWallet","type":"address"}],"name":"assignDrone","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
  }

  // Connect to Compass SEI wallet
  async connectWallet() {
    try {
      let provider;
      
      // Check for Compass SEI wallet first
      if (window.sei) {
        console.log('🧭 Connecting to Compass SEI Wallet...');
        provider = new ethers.BrowserProvider(window.sei);
        
        // Request account access
        const accounts = await window.sei.request({ method: 'eth_requestAccounts' });
        this.walletAddress = accounts[0];
        
      } else if (window.ethereum) {
        console.log('🦊 Connecting to EVM Wallet (MetaMask/etc)...');
        provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check network and switch to Sei if needed
        await this.ensureSeiNetwork();
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.walletAddress = accounts[0];
        
      } else {
        throw new Error('No Sei or EVM wallet found. Please install Compass Wallet for Sei.');
      }

      this.provider = provider;
      this.signer = await provider.getSigner();
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);

      console.log(`✅ Wallet connected: ${this.walletAddress}`);
      
      // Get balance
      const balance = await this.provider.getBalance(this.walletAddress);
      console.log(`💰 Balance: ${ethers.formatEther(balance)} SEI`);
      
      return {
        address: this.walletAddress,
        balance: ethers.formatEther(balance)
      };
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      throw error;
    }
  }

  // Ensure we're on Sei network
  async ensureSeiNetwork() {
    if (!window.ethereum) return;
    
    try {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const seiTestnetChainId = '0x530'; // 1328 in hex (Sei EVM Testnet)
      const seiMainnetChainId = '0xaef13'; // 716819 in hex (Sei Pacific-1 Mainnet)
      
      if (currentChainId === seiTestnetChainId || currentChainId === seiMainnetChainId) {
        console.log('✅ Already on Sei network');
        return;
      }

      // Try to switch to testnet first
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: seiTestnetChainId }],
        });
      } catch (switchError) {
        // If testnet is not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: seiTestnetChainId,
              chainName: 'Sei EVM Testnet',
              rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
              nativeCurrency: {
                name: 'Sei',
                symbol: 'SEI',
                decimals: 18,
              },
              blockExplorerUrls: ['https://seitrace.com'],
            }],
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not switch to Sei network:', error);
    }
  }

  // Send SEI tokens to an address
  async sendSEI(toAddress, amountSEI, memo = '') {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log(`🔄 Sending ${amountSEI} SEI to ${toAddress}...`);
      
      const tx = await this.signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amountSEI.toString()),
        data: memo ? ethers.toUtf8Bytes(memo) : '0x'
      });

      console.log(`📝 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed: ${receipt.transactionHash}`);
      
      return {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  // Post job to smart contract
  async postJob(details, recipientAddress, amountSEI) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log(`📝 Posting job: ${details}`);
      console.log(`👤 Recipient: ${recipientAddress}`);
      console.log(`💰 Amount: ${amountSEI} SEI`);

      const tx = await this.contract.postJob(details, recipientAddress, {
        value: ethers.parseEther(amountSEI.toString())
      });

      console.log(`📝 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Job posted: ${receipt.transactionHash}`);

      // Extract job ID from logs
      let jobId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          if (parsed && parsed.name === 'JobPosted') {
            jobId = parsed.args.jobId.toString();
            break;
          }
        } catch (logError) {
          continue;
        }
      }

      return {
        jobId,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      console.error('❌ Job posting failed:', error);
      throw error;
    }
  }

  // Confirm delivery
  async confirmDelivery(jobId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log(`✅ Confirming delivery for job ${jobId}...`);

      const tx = await this.contract.confirmDelivery(jobId);
      console.log(`📝 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Delivery confirmed: ${receipt.transactionHash}`);

      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      console.error('❌ Delivery confirmation failed:', error);
      throw error;
    }
  }

  // Assign drone to job
  async assignDrone(jobId, droneWalletAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log(`🚁 Assigning drone ${droneWalletAddress} to job ${jobId}...`);

      const tx = await this.contract.assignDrone(jobId, droneWalletAddress);
      console.log(`📝 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Drone assigned: ${receipt.transactionHash}`);

      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      console.error('❌ Drone assignment failed:', error);
      throw error;
    }
  }

  // Batch send SEI to multiple addresses (for fund distribution)
  async distributeFunds(distributions) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const results = [];
    
    for (const { address, amount, label } of distributions) {
      try {
        console.log(`💸 Distributing ${amount} SEI to ${label} (${address})...`);
        
        const result = await this.sendSEI(address, amount, `Fund Distribution - ${label}`);
        results.push({
          ...result,
          address,
          amount,
          label,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Failed to send to ${label}:`, error);
        results.push({
          address,
          amount,
          label,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Get wallet info
  getWalletInfo() {
    return {
      address: this.walletAddress,
      connected: !!this.signer
    };
  }

  // Disconnect wallet
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.walletAddress = null;
    console.log('👋 Wallet disconnected');
  }
}

// Create singleton instance
const walletService = new WalletService();

export default walletService;
