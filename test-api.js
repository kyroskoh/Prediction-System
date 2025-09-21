const express = require('express');
const { spawn } = require('child_process');

// Test the API endpoints
async function testAPI() {
    console.log('🚀 Testing Prediction System API...\n');
    
    // Start server in background
    console.log('Starting server...');
    const server = spawn('node', ['index.js'], { detached: true });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test endpoints using curl equivalent
    const tests = [
        {
            name: 'Health Check',
            url: 'http://localhost:6000/',
            expected: 'I am alive!'
        },
        {
            name: 'Check Status (should be closed initially)',
            url: 'http://localhost:6000/prediction/testchannel/status',
            expected: 'closed'
        },
        {
            name: 'Open Prediction',
            url: 'http://localhost:6000/prediction/testchannel/open',
            expected: 'opened'
        },
        {
            name: 'Add Prediction',
            url: 'http://localhost:6000/prediction/testchannel/add?username=testuser&prediction=13-10',
            expected: 'added successfully'
        },
        {
            name: 'List Predictions',
            url: 'http://localhost:6000/prediction/testchannel/list',
            expected: 'testuser: 13-10'
        }
    ];

    for (const test of tests) {
        try {
            const response = await fetch(test.url);
            const result = await response.text();
            
            const passed = result.toLowerCase().includes(test.expected.toLowerCase());
            console.log(`${passed ? '✅' : '❌'} ${test.name}`);
            console.log(`   Response: ${result}\n`);
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}\n`);
        }
    }
    
    // Clean up
    process.kill(-server.pid);
    console.log('🏁 Test completed!');
}

// Only for Node.js 18+, otherwise use a simple curl test
if (typeof fetch !== 'undefined') {
    testAPI();
} else {
    console.log('📝 To test the API manually, run:');
    console.log('1. Start server: node index.js');
    console.log('2. Test health: curl http://localhost:6000/');
    console.log('3. Open prediction: curl "http://localhost:6000/prediction/testchannel/open"');
    console.log('4. Add prediction: curl "http://localhost:6000/prediction/testchannel/add?username=testuser&prediction=13-10"');
}