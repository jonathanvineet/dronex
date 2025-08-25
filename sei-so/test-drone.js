// test-drone.js - Simple test for the DroneManagementSystem
require('dotenv').config();
const DroneManagementSystem = require('./elizaos/DroneManagementSystem');

async function testDroneSystem() {
    console.log('🧪 Testing drone management system...');
    
    // Initialize the drone system
    const droneSystem = new DroneManagementSystem();
    
    // Test with Mumbai location - should select DRONE_002
    const mumbaiJob = {
        id: 'TEST_JOB_1',
        pickup: { lat: 20.0760, lng: 73.8777 }, // Mumbai
        delivery: { lat: 19.2183, lng: 72.9781 },
        weight: 2.5,
        sender: '0x2B5c206516c34896D41DB511BAB9E878F8C1C109'
    };
    
    // Wait a moment for the drone system to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n🚀 Test 1: Mumbai Job - Should select DRONE_002');
    const mumbaiResult = await droneSystem.processDeliveryConfirmation('TEST_JOB_1', mumbaiJob);
    console.log('Result:', mumbaiResult);
    console.log(`Selected drone: ${mumbaiResult.droneId}`);
    
    // Reset drone status
    droneSystem.droneFleet.forEach(drone => drone.status = 'available');
    
    // Test with Delhi location - should select DRONE_001
    const delhiJob = {
        id: 'TEST_JOB_2',
        pickup: { lat: 28.7041, lng: 77.1025 }, // Delhi
        delivery: { lat: 28.5355, lng: 77.3910 },
        weight: 2.5,
        sender: '0xf1A68c0D4c1A8de334240050899324B713Cfc677'
    };
    
    console.log('\n🚀 Test 2: Delhi Job - Should select DRONE_001');
    const delhiResult = await droneSystem.processDeliveryConfirmation('TEST_JOB_2', delhiJob);
    console.log('Result:', delhiResult);
    console.log(`Selected drone: ${delhiResult.droneId}`);
}

// Run the test
testDroneSystem().catch(console.error);
