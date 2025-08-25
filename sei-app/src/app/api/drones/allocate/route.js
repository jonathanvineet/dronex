// Next.js API route for drone allocation
import { NextResponse } from 'next/server';
import DroneManagementSystem from '../../../../../../sei-so/elizaos/DroneManagementSystem';

const droneSystem = new DroneManagementSystem();

export async function POST(request) {
  // Handles /api/drones/allocate POST requests
  const orderData = await request.json();
  const allocation = await droneSystem.allocateOptimalDrone(orderData);
  if (!allocation) {
    return NextResponse.json({ success: false, error: 'No suitable drone available' }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    allocatedDrone: {
      id: allocation.drone.id,
      name: allocation.drone.name,
      status: 'allocated',
      walletAddress: allocation.drone.walletAddress,
      estimatedPickupTime: allocation.timeline.pickup,
      estimatedDeliveryTime: allocation.timeline.delivery,
      batteryLevel: allocation.drone.batteryLevel,
      currentLocation: allocation.drone.location,
      route: allocation.route,
      aiStatus: allocation.aiStatus || 'Hive Intelligence Active - Route Optimized'
    }
  });
}
