// Next.js API route for drone wallet info
import { NextResponse } from 'next/server';
import DroneManagementSystem from '../../../../../../../sei-so/elizaos/DroneManagementSystem';

const droneSystem = new DroneManagementSystem();

export async function GET(request, { params }) {
  // Handles /api/drones/[droneId]/wallet GET requests
  const { droneId } = params;
  const walletInfo = await droneSystem.getDroneWallet(droneId);
  if (!walletInfo) {
    return NextResponse.json({ success: false, error: 'Drone wallet not found' }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    wallet: {
      address: walletInfo.address,
      balance: walletInfo.balance || '0',
      transactions: walletInfo.recentTransactions || [],
      escrowBalance: walletInfo.escrowBalance || '0'
    }
  });
}
