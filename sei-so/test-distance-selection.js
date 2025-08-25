// test-distance-selection.js - Testing the drone selection for a specific location
require('dotenv').config();
const DroneManagementSystem = require('./elizaos/DroneManagementSystem');

async function testDistanceSelection() {
    console.log('🧪 Testing distance-based drone selection...');
    
    // Initialize the drone system
    const droneSystem = new DroneManagementSystem();
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test with the specific location that was causing problems
    const testJob = {
        id: 'TEST_DISTANCE_JOB',
        pickup: { lat: 30.076, lng: 75.8777 }, // Location from the issue
        delivery: { lat: 29.5, lng: 76.0 }, // Arbitrary delivery point
        weight: 2.5
    };
    
    console.log('\n🚀 Testing with location that should select DRONE_001 (closer)');
    
    try {
        const result = await droneSystem.processDeliveryConfirmation('TEST_DISTANCE_JOB', testJob);
        console.log(`✅ Selected drone: ${result.droneId}`);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the test
testDistanceSelection().catch(console.error);
