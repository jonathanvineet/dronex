// Next.js API route for manual drone assignment
import { NextResponse } from 'next/server';
import DroneManagementSystem from '../../../../../../dronex/sei-so/elizaos/DroneManagementSystem';

const droneSystem = new DroneManagementSystem();

export async function POST(request) {
  // Handles /api/assign-drone POST requests
  const { jobId, pickup, delivery, weight } = await request.json();
  if (!jobId) {
    return NextResponse.json({ success: false, error: 'Missing jobId' }, { status: 400 });
  }
  const job = {
    id: jobId,
    pickup: pickup || { lat: 15.2993, lng:74.1240},
    delivery: delivery || { lat: 28.4089, lng: 77.3178 },
    weight: weight || 2.5,
    weatherConditions: 'clear'
  };
  const droneAssignment = await droneSystem.processDeliveryConfirmation(jobId, job);
  return NextResponse.json({ success: true, jobId, assignment: droneAssignment, droneWalletStored: true });
}
