// Next.js API route for drones management
import { NextResponse } from 'next/server';
import DroneManagementSystem from '../../../../../../dronex/sei-so/elizaos/DroneManagementSystem';

const droneSystem = new DroneManagementSystem();

export async function GET(request) {
  // Handles /api/drones GET requests (fetch drones)
  const drones = droneSystem.droneFleet;
  return NextResponse.json({ drones });
}
