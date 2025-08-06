/**
 * Test script for Courts API
 * Run this script to test all court management endpoints
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_KEY = 'padle-management-portal-key-2024';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`\n${options.method || 'GET'} ${endpoint}`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { error };
  }
}

// Test functions
async function testGetAllCourts() {
  console.log('\n=== Testing Get All Courts ===');
  return await apiRequest('/courts/GetAll');
}

async function testCreateCourt() {
  console.log('\n=== Testing Create Court ===');
  const courtData = {
    name: 'Test Court A',
    location: 'Main Building',
    pricePerHour: 50000,
    status: 'available'
  };
  
  return await apiRequest('/courts/Add', {
    method: 'POST',
    body: JSON.stringify(courtData)
  });
}

async function testGetCourtById(courtId) {
  console.log('\n=== Testing Get Court By ID ===');
  return await apiRequest(`/courts/GetByID?id=${courtId}`);
}

async function testUpdateCourt(courtId) {
  console.log('\n=== Testing Update Court ===');
  const updateData = {
    name: 'Updated Test Court A',
    location: 'Updated Location',
    pricePerHour: 60000,
    status: 'available'
  };
  
  return await apiRequest(`/courts/Update?id=${courtId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
}

async function testToggleCourtStatus(courtId) {
  console.log('\n=== Testing Toggle Court Status ===');
  return await apiRequest(`/courts/ToggleStatus?id=${courtId}`, {
    method: 'PATCH'
  });
}

async function testDeleteCourt(courtId) {
  console.log('\n=== Testing Delete Court ===');
  return await apiRequest(`/courts/Delete?id=${courtId}`, {
    method: 'DELETE'
  });
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Courts API Tests...');
  console.log('API Base URL:', API_BASE_URL);
  console.log('API Key:', API_KEY);

  try {
    // Test 1: Get all courts (should work without auth for testing)
    await testGetAllCourts();

    // Test 2: Create a new court (requires admin auth)
    const createResult = await testCreateCourt();
    let courtId = null;
    
    if (createResult.data && createResult.data.isSuccessful) {
      courtId = createResult.data.payload.courtId;
      console.log('✅ Created court with ID:', courtId);
    } else {
      console.log('❌ Failed to create court - this is expected without authentication');
      console.log('Note: Admin authentication is required for create/update/delete operations');
      return;
    }

    if (courtId) {
      // Test 3: Get court by ID
      await testGetCourtById(courtId);

      // Test 4: Update court
      await testUpdateCourt(courtId);

      // Test 5: Toggle court status
      await testToggleCourtStatus(courtId);

      // Test 6: Delete court
      await testDeleteCourt(courtId);
    }

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests();
} else {
  // Browser environment
  window.runCourtsApiTests = runTests;
  console.log('Courts API test functions loaded. Call runCourtsApiTests() to start.');
}
