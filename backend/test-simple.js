// Simple test script for registration
const testData = {
    username: "testuser456",
    email: "testuser456@example.com",
    password: "password123",
    fullName: "Test User 456",
    phoneNumber: "+8801234567892",
    role: "RESTAURANT_OWNER",
    restaurantName: "Test Restaurant 456",
    restaurantAddress: "789 Test Road, Dhaka",
    restaurantDescription: "A test restaurant for debugging",
    restaurantPhone: "+8801234567892",
    restaurantEmail: "restaurant456@test.com"
};

fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData)
})
.then(response => {
    console.log('Status:', response.status);
    return response.text();
})
.then(data => {
    console.log('Response:', data);
})
.catch(error => {
    console.error('Error:', error);
});
