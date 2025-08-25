import { useState, useEffect } from "react";
import { ethers } from "ethers";
import walletService from '../services/walletService';

// Flag to use wallet service for all transactions
const USE_COMPASS_WALLET = true;
const CONTRACT_ABI = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":true,"internalType":"address","name":"recipient","type":"address"},{"indexed":true,"internalType":"address","name":"feeWallet","type":"address"},{"indexed":false,"internalType":"uint256","name":"recipientAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"feeAmount","type":"uint256"}],"name":"JobCompleted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"JobFunded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"jobId","type":"uint256"},{"indexed":true,"internalType":"address","name":"poster","type":"address"},{"indexed":false,"internalType":"string","name":"details","type":"string"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"address","name":"feeWallet","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"JobPosted","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"jobId","type":"uint256"}],"name":"confirmDelivery","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"jobCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"jobs","outputs":[{"internalType":"address","name":"poster","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"address","name":"feeWallet","type":"address"},{"internalType":"string","name":"details","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"funded","type":"bool"},{"internalType":"bool","name":"completed","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"string","name":"details","type":"string"},{"internalType":"address","name":"recipient","type":"address"}],"name":"postJob","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},
  {"inputs":[],"name":"FEE_WALLET","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
];
const CONTRACT_ADDRESS = "0x233D7487e447248DF9f71C6db46e8454254EB808";

export default function Home() {
  // Poll backend for delivery confirmation and release funds
  async function pollDeliveryConfirmation(jobId) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/job/${jobId}/status`);
        const data = await res.json();
        if (data.status === 'confirmed') {
          clearInterval(interval);
          setStatus(`Delivery confirmed for job ${jobId}. Funds released!`);
        }
      } catch (err) {
        console.error('Error polling delivery confirmation:', err);
      }
    }, 5000); // Poll every 5 seconds
  }

  // Call confirmDelivery on the contract
  async function releaseFunds(jobId) {
    try {
      let provider;
      if (window.sei) {
        provider = new ethers.BrowserProvider(window.sei);
      } else if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        setStatus("No Sei or EVM wallet found");
        return;
      }
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.confirmDelivery(jobId);
      setStatus(`Funds released! Transaction: ${tx.hash}`);
      await tx.wait();
    } catch (err) {
      setStatus(`Error releasing funds: ${err.message}`);
      console.error('Error releasing funds:', err);
    }
  }
  const [walletAddress, setWalletAddress] = useState("");
  const [details, setDetails] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [droneFee, setDroneFee] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");

  async function connectWallet() {
    try {
      setStatus('🧭 Connecting to Compass SEI Wallet...');
      
      if (USE_COMPASS_WALLET) {
        // Use the new wallet service
        const walletInfo = await walletService.connectWallet();
        setWalletAddress(walletInfo.address);
        setStatus(`✅ Compass SEI Wallet connected: ${walletInfo.address}. Balance: ${walletInfo.balance} SEI`);
        
      } else {
        // Fallback to old method (for testing)
        let accounts;
        if (window.sei) {
          setStatus("Sei Global Wallet detected. Connecting...");
          accounts = await window.sei.request({ method: 'eth_requestAccounts' });
          setWalletAddress(accounts[0]);
          setStatus("Wallet connected: " + accounts[0]);
        } else if (window.ethereum) {
          setStatus("EVM wallet detected. Connecting...");
          accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setWalletAddress(accounts[0]);
          setStatus("Wallet connected: " + accounts[0]);
        } else {
          setStatus("No Sei or EVM wallet found. Please install Compass Wallet for Sei.");
          return;
        }
      }
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      setStatus(`❌ Wallet connection failed: ${error.message}`);
    }
  }

  // Handle fund distribution through wallet
  async function handleFundDistribution(jobId, totalAmountSEI, storeWallet) {
    try {
      setStatus(`💰 Processing fund distribution for job ${jobId}...`);
      
      // Get distribution info from backend
      const distributionRes = await fetch('http://localhost:3001/api/wallet/get-distribution-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          droneWallet: 'TBD', // Will be filled by backend from job assignment
          storeWallet,
          totalAmountSEI
        })
      });
      
      if (!distributionRes.ok) {
        throw new Error('Failed to get distribution info from backend');
      }
      
      const distributionData = await distributionRes.json();
      
      if (distributionData.success && distributionData.distributions.length > 0) {
        console.log('💸 Distribution plan:', distributionData);
        setStatus(`💸 Distributing funds: ${distributionData.distributions.length} payments...`);
        
        // Use wallet service to distribute funds
        const results = await walletService.distributeFunds(distributionData.distributions);
        
        console.log('💰 Distribution results:', results);
        
        // Notify backend of completion
        await fetch('http://localhost:3001/api/wallet/confirm-distribution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            transactions: results.filter(r => r.success)
          })
        });
        
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        setStatus(`✅ Fund distribution complete! ${successCount}/${totalCount} payments successful`);
        
      } else {
        setStatus('ℹ️ No fund distribution needed for this job');
      }
      
    } catch (error) {
      console.error('❌ Fund distribution failed:', error);
      setStatus(`❌ Fund distribution failed: ${error.message}`);
    }
  }

  // ...existing code...

  async function postJob() {
    console.log('Post Job clicked');
    
    try {
      // Validate recipient address
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
        setStatus("Invalid recipient address");
        console.error("Invalid recipient address", recipient);
        return;
      }
      
      // Validate amount - we use totalAmount which includes the drone fee
      let amountToSend;
      try {
        // If totalAmount is set, use it (including drone fee), otherwise fall back to amount
        amountToSend = totalAmount || amount;
        const parsedAmount = parseFloat(amountToSend);
        console.log(`Using total amount (with 10% drone fee): ${amountToSend} SEI`);
        
        if (parsedAmount <= 0) {
          setStatus("Amount must be greater than 0");
          return;
        }
        
        if (parsedAmount < 0.001) {
          setStatus("Error: Minimum 0.001 SEI required");
          return;
        }
        
      } catch (err) {
        setStatus("Invalid amount format");
        console.error("Invalid amount format", err, amount);
        return;
      }
      
      // Additional validation
      if (recipient.toLowerCase() === walletAddress.toLowerCase()) {
        setStatus("Error: Recipient cannot be the same as sender");
        return;
      }
      
      if (!details.trim()) {
        setStatus("Error: Please enter job details");
        return;
      }
      
      if (USE_COMPASS_WALLET) {
        // Use wallet service for transaction
        setStatus('📝 Posting job to smart contract...');
        
        const result = await walletService.postJob(details, recipient, amountToSend);
        
        if (result.jobId) {
          setStatus(`✅ Job posted successfully! Job ID: ${result.jobId}. Transaction: ${result.txHash}`);
          
          // Notify backend
          await fetch("http://localhost:3001/job", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId: result.jobId }),
          });
          
          console.log('🎉 Backend notified of new job:', result.jobId);
          
          // Start polling for delivery confirmation
          pollDeliveryConfirmation(result.jobId);
          
          // Check for fund distribution after 15 seconds
          setTimeout(async () => {
            await handleFundDistribution(result.jobId, amountToSend, recipient);
          }, 15000);
          
        } else {
          setStatus('❌ Job posting failed - no job ID returned');
        }
        
      } else {
        // Fallback to old method
        console.log('Using fallback transaction method...');
        setStatus('⚠️ Using fallback transaction method');
        // ... (keep old implementation for fallback)
      }
      
    } catch (err) {
      console.error('❌ Error posting job:', err);
      setStatus(`❌ Error posting job: ${err.message}`);
    }
  }
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sei Delivery Platform</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      <div style={{ marginTop: '1rem' }}>
        <div>Status: {status}</div>
        <div>Wallet: {walletAddress}</div>
      </div>
      {/* Function to calculate drone fee and total amount */}
      <div style={{ marginTop: '1rem', marginBottom: '1rem', padding: '1rem', backgroundColor: '#f4f4f4', borderRadius: '5px' }}>
        <h3>Drone Fee Explained</h3>
        <p>A 10% drone fee is added to your transaction. This fee structure works as follows:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
          <li><strong>80%</strong> of your base amount goes to the recipient</li>
          <li><strong>10%</strong> of your base amount goes to the platform fee wallet</li>
          <li><strong>10%</strong> drone fee is either:
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Sent to the assigned drone operator if a drone is assigned</li>
              <li>Returned to you (the sender) if no drone is assigned</li>
            </ul>
          </li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>Example: If you send 0.2 SEI, you'll be charged 0.22 SEI total (including 0.02 SEI drone fee)</p>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          postJob();
        }}
        style={{ marginTop: '2rem' }}
      >
        <input
          type="text"
          placeholder="Job Details"
          value={details}
          onChange={e => setDetails(e.target.value)}
          style={{ marginRight: '1rem', marginBottom: '1rem', padding: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          style={{ marginRight: '1rem', marginBottom: '1rem', padding: '0.5rem' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Base Amount (SEI)"
            value={amount}
            onChange={e => {
              const baseAmount = e.target.value;
              setAmount(baseAmount);
              
              // Calculate drone fee (10% of base amount)
              try {
                if (baseAmount && !isNaN(parseFloat(baseAmount))) {
                  const baseAmountFloat = parseFloat(baseAmount);
                  const droneFeeAmount = baseAmountFloat * 0.1;
                  const totalAmountValue = baseAmountFloat + droneFeeAmount;
                  
                  setDroneFee(droneFeeAmount.toFixed(6));
                  setTotalAmount(totalAmountValue.toFixed(6));
                } else {
                  setDroneFee("");
                  setTotalAmount("");
                }
              } catch (err) {
                console.error("Error calculating fee:", err);
                setDroneFee("");
                setTotalAmount("");
              }
            }}
            style={{ marginRight: '1rem', marginBottom: '0.5rem', padding: '0.5rem' }}
          />
          {droneFee && (
            <div style={{ marginBottom: '0.5rem' }}>
              <p>Drone Fee (10%): <strong>{droneFee} SEI</strong></p>
              <p>Total Amount: <strong>{totalAmount} SEI</strong></p>
            </div>
          )}
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Post Job with Drone Fee</button>
      </form>
    </div>
  );
}
