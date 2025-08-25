// Next.js API route for hive intelligence analytics
import { NextResponse } from 'next/server';
import DroneManagementSystem from '../../../../../../sei-so/elizaos/DroneManagementSystem';

const droneSystem = new DroneManagementSystem();

export async function GET(request) {
  // Handles /api/hive-analytics GET requests
  const analytics = droneSystem.generateHiveAnalytics();
  return NextResponse.json(analytics);
}
