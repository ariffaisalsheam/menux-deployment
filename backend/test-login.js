// Test login with the user we just created
const loginData = {
    username: "testuser456",
    password: "password123"
};

fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginData)
})
.then(response => {
    console.log('Login Status:', response.status);
    return response.text();
})
.then(data => {
    console.log('Login Response:', data);
})
.catch(error => {
    console.error('Login Error:', error);
});
