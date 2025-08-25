"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import compassWalletService from "@/services/compassWalletService";

const DEFAULT_CHAIN_ID = process.env.NEXT_PUBLIC_SEI_CHAIN_ID || "atlantic-2";
const DEFAULT_DENOM = process.env.NEXT_PUBLIC_SEI_DENOM || "usei";

function truncateMiddle(value, prefix = 8, suffix = 6) {
  if (!value) return "";
  if (value.length <= prefix + suffix + 3) return value;
  return `${value.slice(0, prefix)}...${value.slice(-suffix)}`;
}

export default function WalletConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'compass' | 'keplr' | 'leap'

  const chainId = useMemo(() => DEFAULT_CHAIN_ID, []);

  // Update wallet info from service
  const updateWalletInfo = useCallback(async () => {
    const info = compassWalletService.getConnectionInfo();
    setIsConnected(info.isConnected);
    setWalletAddress(info.address || "");
    setWalletBalance(info.balance);
  }, []);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined") return;
      
      console.debug('[WalletConnection] Checking for existing Compass wallet connection');
      
      try {
        const hasExisting = await compassWalletService.checkExistingConnection();
        if (hasExisting) {
          await updateWalletInfo();
          const provider = compassWalletService.getCompassProvider();
          if (provider) {
            setWalletType(provider.name.toLowerCase());
          }
        }
      } catch (error) {
        console.debug('[WalletConnection] No existing connection found:', error);
      }
    };
    
    checkConnection();
  }, [updateWalletInfo]);

  const connectWallet = async () => {
    if (typeof window === "undefined") return;
    
    if (!compassWalletService.isCompassAvailable()) {
      alert("Compass wallet not found. Please install Compass, Keplr, or Leap wallet extension.");
      return;
    }

    setIsConnecting(true);
    try {
      console.debug('[WalletConnection] Connecting via Compass wallet service...');
      
      const result = await compassWalletService.connectWallet();
      
      if (result.isConnected) {
        await updateWalletInfo();
        setWalletType(result.wallet);
        console.log(`✅ Successfully connected to ${result.wallet}: ${result.address}`);
      }
      
    } catch (err) {
      console.error("❌ Compass wallet connection failed:", err);
      let errorMessage = "Failed to connect wallet. Please try again.";
      
      if (err.message.includes('not found')) {
        errorMessage = "Compass wallet not found. Please install Compass, Keplr, or Leap wallet extension.";
      } else if (err.message.includes('rejected')) {
        errorMessage = "Connection was rejected. Please approve the connection in your wallet.";
      } else if (err.message.includes('enable')) {
        errorMessage = "Failed to enable Sei chain. Please add Sei network to your wallet.";
      }
      
      alert(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    compassWalletService.disconnect();
    setIsConnected(false);
    setWalletAddress("");
    setWalletBalance(null);
    setWalletType(null);
    console.log('👋 Wallet disconnected');
  };

  // Refresh balance function
  const refreshBalance = async () => {
    if (!isConnected) return;
    
    setIsFetchingBalance(true);
    try {
      await compassWalletService.updateBalance();
      await updateWalletInfo();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  return (
    <div className="hud-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-orbitron text-xl text-drone-highlight mb-1">SEI Wallet</h2>
          <p className="text-xs text-gray-400">Chain: <span className="font-mono">{chainId}</span></p>
        </div>
        {!isConnected ? (
          <button className="btn-drone font-russo" onClick={connectWallet} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        ) : (
          <button className="btn-drone font-russo cursor-pointer" onClick={disconnectWallet}>
            Disconnect
          </button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <div className="text-sm text-gray-300">
          <span className="text-gray-400">Status:</span> {isConnected ? "Connected" : "Not Connected"}
        </div>
        <div className="text-sm text-gray-300">
          <span className="text-gray-400">Address:</span> {isConnected ? truncateMiddle(walletAddress) : "—"}
        </div>
        <div className="text-sm text-gray-300 flex items-center gap-3">
          <span className="text-gray-400">Balance:</span>
          <span>{walletBalance == null ? (isFetchingBalance ? "Loading..." : "—") : `${walletBalance.toFixed(6)} SEI`}</span>
          {isConnected && (
            <button className="btn-drone font-russo cursor-pointer" onClick={refreshBalance} disabled={isFetchingBalance}>
              {isFetchingBalance ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
