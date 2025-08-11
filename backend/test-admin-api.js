const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

const testAdminAPI = async () => {
  try {
    console.log('🔐 Testing Admin API Endpoints...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test get all users
    console.log('\n2. Testing GET /admin/users...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users`, { headers });
    console.log('✅ Users retrieved:', usersResponse.data.length, 'users found');
    console.log('   Sample user:', usersResponse.data[0]?.fullName || 'No users');

    // Step 3: Test get all restaurants
    console.log('\n3. Testing GET /admin/restaurants...');
    const restaurantsResponse = await axios.get(`${API_BASE}/admin/restaurants`, { headers });
    console.log('✅ Restaurants retrieved:', restaurantsResponse.data.length, 'restaurants found');
    console.log('   Sample restaurant:', restaurantsResponse.data[0]?.name || 'No restaurants');

    // Step 4: Test platform analytics
    console.log('\n4. Testing GET /admin/analytics...');
    const analyticsResponse = await axios.get(`${API_BASE}/admin/analytics`, { headers });
    console.log('✅ Platform analytics retrieved:');
    console.log('   Total Users:', analyticsResponse.data.totalUsers);
    console.log('   Total Restaurants:', analyticsResponse.data.totalRestaurants);
    console.log('   Pro Subscriptions:', analyticsResponse.data.proSubscriptions);
    console.log('   Monthly Revenue: ৳', analyticsResponse.data.monthlyRevenue);

    // Step 5: Test update user plan (if there are restaurant owners)
    const restaurantOwners = usersResponse.data.filter(user => user.role === 'RESTAURANT_OWNER');
    if (restaurantOwners.length > 0) {
      const testUser = restaurantOwners[0];
      console.log(`\n5. Testing PUT /admin/users/${testUser.id}/plan...`);
      
      const newPlan = testUser.subscriptionPlan === 'BASIC' ? 'PRO' : 'BASIC';
      const updateResponse = await axios.put(`${API_BASE}/admin/users/${testUser.id}/plan`, {
        subscriptionPlan: newPlan
      }, { headers });
      
      console.log('✅ User plan updated successfully');
      console.log(`   ${testUser.fullName} plan changed to: ${newPlan}`);
    } else {
      console.log('\n5. ⚠️ No restaurant owners found to test plan update');
    }

    console.log('\n🎉 All Admin API tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Admin API:', error.response?.data || error.message);
    if (error.response?.status === 403) {
      console.error('   Make sure you are logged in as a Super Admin');
    }
  }
};

testAdminAPI();
