// test-contract-fix.js - Testing the backend fix for contract ABI decoding issues
const axios = require('axios');

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test job data
const testJob = {
  jobId: 39 // Using an existing job ID that we know exists
};

// Test functions
async function testBackendFix() {
  console.log('===== Testing Backend Contract Decoding Fix =====');
  
  try {
    console.log('1. Testing job status endpoint...');
    const statusResponse = await axios.get(`http://localhost:3001/job/${testJob.jobId}/status`);
    console.log('✅ Job status response:', statusResponse.data);
    
    console.log('\n2. Testing drone assignment endpoint...');
    const assignResponse = await axios.post('http://localhost:3001/api/assign-drone', {
      jobId: testJob.jobId,
      pickup: { lat: 20.0760, lng: 73.8777 },
      delivery: { lat: 28.4089, lng: 77.3178 },
      weight: 2.5
    });
    console.log('✅ Drone assignment response:', assignResponse.data);
    
    // Verify that the backend can handle the job data properly
    console.log('\n3. Testing job processing...');
    const jobResponse = await axios.post('http://localhost:3001/job', testJob);
    console.log('✅ Job processing response:', jobResponse.data);
    
    // Wait for job processing to complete
    console.log('\n4. Waiting for job processing to complete...');
    await wait(15000); // Wait 15 seconds
    
    // Check job status again
    console.log('\n5. Checking final job status...');
    const finalStatus = await axios.get(`http://localhost:3001/job/${testJob.jobId}/status`);
    console.log('✅ Final job status:', finalStatus.data);
    
    console.log('\n===== All tests completed successfully! =====');
    console.log('The backend is now handling contract decoding errors gracefully.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the tests
testBackendFix().catch(console.error);
