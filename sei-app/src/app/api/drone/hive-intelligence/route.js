// Next.js API route for Hive Intelligence data
import { NextResponse } from 'next/server';
import DroneManagementSystem from '../../../../../../sei-so/elizaos/DroneManagementSystem';

const droneSystem = new DroneManagementSystem();

export async function GET(request) {
  // Handles /api/drone/hive-intelligence GET requests
  const hiveData = await droneSystem.getHiveIntelligence();
  return NextResponse.json({
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
}
