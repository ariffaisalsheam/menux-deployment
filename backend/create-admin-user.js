const axios = require('axios');

const createAdminUser = async () => {
  try {
    console.log('Creating Super Admin user...');
    
    const adminUserData = {
      username: 'admin',
      password: 'admin123',
      email: 'admin@menux.com',
      fullName: 'System Administrator',
      role: 'SUPER_ADMIN'
    };

    const response = await axios.post('http://localhost:8080/api/auth/register', adminUserData);
    
    console.log('✅ Super Admin user created successfully!');
    console.log('Login credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: SUPER_ADMIN');
    console.log('\nResponse:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error creating admin user:', error.response.data);
    } else {
      console.error('❌ Network error:', error.message);
    }
  }
};

createAdminUser();
