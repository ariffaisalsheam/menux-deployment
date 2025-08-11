const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

class MenuXSystemTester {
  constructor() {
    this.adminToken = null;
    this.restaurantOwnerToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(description, testFn) {
    try {
      this.log(`Testing: ${description}`);
      await testFn();
      this.testResults.passed++;
      this.log(`✅ PASSED: ${description}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ description, error: error.message });
      this.log(`❌ FAILED: ${description} - ${error.message}`, 'error');
    }
  }

  async authenticateAdmin() {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    this.adminToken = response.data.token;
    return response.data;
  }

  async createTestRestaurantOwner() {
    const userData = {
      username: 'testowner',
      password: 'test123',
      email: 'testowner@menux.com',
      fullName: 'Test Restaurant Owner',
      role: 'RESTAURANT_OWNER',
      restaurantName: 'Test Restaurant',
      restaurantAddress: '123 Test Street, Dhaka',
      restaurantDescription: 'A test restaurant for system validation'
    };

    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    return response.data;
  }

  async authenticateRestaurantOwner() {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'testowner',
      password: 'test123'
    });
    this.restaurantOwnerToken = response.data.token;
    return response.data;
  }

  getHeaders(token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async runAllTests() {
    this.log('🚀 Starting Menu.X Complete System Test Suite');
    
    try {
      // Phase 1: Authentication and User Management
      await this.testAuthenticationFlow();
      
      // Phase 2: Admin Dashboard Functionality
      await this.testAdminDashboard();
      
      // Phase 3: Restaurant Owner Dashboard
      await this.testRestaurantOwnerDashboard();
      
      // Phase 4: AI System Testing
      await this.testAISystem();
      
      // Phase 5: Data Flow Validation
      await this.testDataFlowIntegrity();
      
      // Phase 6: Security and Access Control
      await this.testSecurityAndAccessControl();
      
      // Phase 7: Error Handling and Edge Cases
      await this.testErrorHandling();

    } catch (error) {
      this.log(`Critical test failure: ${error.message}`, 'error');
    }

    this.printTestSummary();
  }

  async testAuthenticationFlow() {
    this.log('📋 Phase 1: Authentication and User Management');

    await this.test('Admin login', async () => {
      const result = await this.authenticateAdmin();
      if (!result.token || result.role !== 'SUPER_ADMIN') {
        throw new Error('Admin authentication failed');
      }
    });

    await this.test('Create test restaurant owner', async () => {
      await this.createTestRestaurantOwner();
    });

    await this.test('Restaurant owner login', async () => {
      const result = await this.authenticateRestaurantOwner();
      if (!result.token || result.role !== 'RESTAURANT_OWNER') {
        throw new Error('Restaurant owner authentication failed');
      }
    });
  }

  async testAdminDashboard() {
    this.log('📋 Phase 2: Admin Dashboard Functionality');

    await this.test('Get platform analytics', async () => {
      const response = await axios.get(`${API_BASE}/admin/analytics`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      const analytics = response.data;
      if (!analytics.totalUsers || !analytics.totalRestaurants) {
        throw new Error('Invalid analytics data structure');
      }
    });

    await this.test('Get all users', async () => {
      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('No users found in system');
      }
    });

    await this.test('Get all restaurants', async () => {
      const response = await axios.get(`${API_BASE}/admin/restaurants`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid restaurants data structure');
      }
    });

    await this.test('Update user subscription plan', async () => {
      // Find the test restaurant owner
      const usersResponse = await axios.get(`${API_BASE}/admin/users`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      const testUser = usersResponse.data.find(user => user.username === 'testowner');
      if (!testUser) {
        throw new Error('Test user not found');
      }

      await axios.put(`${API_BASE}/admin/users/${testUser.id}/plan`, 
        { subscriptionPlan: 'PRO' },
        { headers: this.getHeaders(this.adminToken) }
      );
    });
  }

  async testRestaurantOwnerDashboard() {
    this.log('📋 Phase 3: Restaurant Owner Dashboard');

    await this.test('Get current restaurant', async () => {
      const response = await axios.get(`${API_BASE}/restaurants/current`, {
        headers: this.getHeaders(this.restaurantOwnerToken)
      });
      
      if (!response.data.name || !response.data.address) {
        throw new Error('Invalid restaurant data structure');
      }
    });

    await this.test('Get restaurant analytics', async () => {
      const response = await axios.get(`${API_BASE}/analytics/restaurant`, {
        headers: this.getHeaders(this.restaurantOwnerToken)
      });
      
      if (!response.data.revenue || !response.data.orders) {
        throw new Error('Invalid restaurant analytics structure');
      }
    });

    await this.test('Get menu items', async () => {
      const response = await axios.get(`${API_BASE}/menu`, {
        headers: this.getHeaders(this.restaurantOwnerToken)
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid menu items data structure');
      }
    });

    await this.test('Get orders', async () => {
      const response = await axios.get(`${API_BASE}/orders`, {
        headers: this.getHeaders(this.restaurantOwnerToken)
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid orders data structure');
      }
    });
  }

  async testAISystem() {
    this.log('📋 Phase 4: AI System Testing');

    await this.test('Get AI providers (admin)', async () => {
      const response = await axios.get(`${API_BASE}/admin/ai-config`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid AI providers data structure');
      }
    });

    await this.test('Create test AI provider', async () => {
      const providerData = {
        name: 'Test Provider',
        type: 'GOOGLE_GEMINI',
        apiKey: 'test-api-key-12345',
        isActive: true,
        isPrimary: false
      };

      await axios.post(`${API_BASE}/admin/ai-config`, providerData, {
        headers: this.getHeaders(this.adminToken)
      });
    });

    // Note: Actual AI API calls would require valid API keys
    // This tests the system structure without making external calls
  }

  async testDataFlowIntegrity() {
    this.log('📋 Phase 5: Data Flow Validation');

    await this.test('Data persistence check', async () => {
      // Verify that data persists across requests
      const response1 = await axios.get(`${API_BASE}/admin/users`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      const response2 = await axios.get(`${API_BASE}/admin/users`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      if (JSON.stringify(response1.data) !== JSON.stringify(response2.data)) {
        throw new Error('Data inconsistency detected');
      }
    });

    await this.test('Real-time synchronization', async () => {
      // Test that changes are immediately reflected
      const usersResponse = await axios.get(`${API_BASE}/admin/users`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      const testUser = usersResponse.data.find(user => user.username === 'testowner');
      
      // Update plan
      await axios.put(`${API_BASE}/admin/users/${testUser.id}/plan`, 
        { subscriptionPlan: 'BASIC' },
        { headers: this.getHeaders(this.adminToken) }
      );
      
      // Verify change
      const updatedResponse = await axios.get(`${API_BASE}/admin/users`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      const updatedUser = updatedResponse.data.find(user => user.username === 'testowner');
      if (updatedUser.subscriptionPlan !== 'BASIC') {
        throw new Error('Real-time update not reflected');
      }
    });
  }

  async testSecurityAndAccessControl() {
    this.log('📋 Phase 6: Security and Access Control');

    await this.test('JWT authentication required', async () => {
      try {
        await axios.get(`${API_BASE}/admin/users`);
        throw new Error('Unauthenticated request should fail');
      } catch (error) {
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          throw new Error('Expected 401/403 for unauthenticated request');
        }
      }
    });

    await this.test('Role-based access control', async () => {
      try {
        await axios.get(`${API_BASE}/admin/users`, {
          headers: this.getHeaders(this.restaurantOwnerToken)
        });
        throw new Error('Restaurant owner should not access admin endpoints');
      } catch (error) {
        if (error.response?.status !== 403) {
          throw new Error('Expected 403 for unauthorized role access');
        }
      }
    });

    await this.test('API key encryption validation', async () => {
      const response = await axios.get(`${API_BASE}/admin/ai-config`, {
        headers: this.getHeaders(this.adminToken)
      });
      
      const providers = response.data;
      for (const provider of providers) {
        if (provider.maskedApiKey && !provider.maskedApiKey.includes('*')) {
          throw new Error('API key not properly masked');
        }
      }
    });
  }

  async testErrorHandling() {
    this.log('📋 Phase 7: Error Handling and Edge Cases');

    await this.test('Invalid endpoint handling', async () => {
      try {
        await axios.get(`${API_BASE}/nonexistent-endpoint`, {
          headers: this.getHeaders(this.adminToken)
        });
        throw new Error('Invalid endpoint should return 404');
      } catch (error) {
        if (error.response?.status !== 404) {
          throw new Error('Expected 404 for invalid endpoint');
        }
      }
    });

    await this.test('Invalid data validation', async () => {
      try {
        await axios.post(`${API_BASE}/admin/ai-config`, {
          name: '', // Invalid empty name
          type: 'INVALID_TYPE',
          apiKey: ''
        }, {
          headers: this.getHeaders(this.adminToken)
        });
        throw new Error('Invalid data should be rejected');
      } catch (error) {
        if (error.response?.status !== 400) {
          throw new Error('Expected 400 for invalid data');
        }
      }
    });
  }

  printTestSummary() {
    this.log('\n📊 TEST SUMMARY');
    this.log(`✅ Passed: ${this.testResults.passed}`);
    this.log(`❌ Failed: ${this.testResults.failed}`);
    this.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.errors.length > 0) {
      this.log('\n🔍 FAILED TESTS:');
      this.testResults.errors.forEach(error => {
        this.log(`   • ${error.description}: ${error.error}`, 'error');
      });
    }
    
    if (this.testResults.failed === 0) {
      this.log('\n🎉 ALL TESTS PASSED! Menu.X system is ready for production.', 'success');
    } else {
      this.log('\n⚠️  Some tests failed. Please review and fix issues before production deployment.', 'error');
    }
  }
}

// Run the complete test suite
const tester = new MenuXSystemTester();
tester.runAllTests().catch(error => {
  console.error('Test suite failed to run:', error);
  process.exit(1);
});
