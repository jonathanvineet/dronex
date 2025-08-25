// Next.js API route for available drones
import { NextResponse } from 'next/server';
import DroneManagementSystem from '../../../../../../sei-so/elizaos/DroneManagementSystem';

const droneSystem = new DroneManagementSystem();

export async function GET(request) {
  // Handles /api/drones/available GET requests
  const fleetStatus = droneSystem.getFleetStatus();
  const availableDrones = fleetStatus.filter(drone => drone.status === 'available' || drone.status === 'idle');
  return NextResponse.json({ success: true, drones: availableDrones });
}
