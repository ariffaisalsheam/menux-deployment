# Menu.X Subscription Management Test Guide

This guide demonstrates how to test the Super Admin subscription management functionality.

## Prerequisites

1. Backend server running on http://localhost:8080
2. Frontend server running on http://localhost:5173
3. Test data initialized (admin user and restaurant owner)

## Test Credentials

### Super Admin
- Username: `admin`
- Password: `admin123`

### Restaurant Owner
- Username: `testowner`
- Password: `password123`

## Test Steps

### 1. Login as Super Admin

1. Navigate to http://localhost:5173/login
2. Enter admin credentials
3. Verify you're redirected to the admin dashboard

### 2. Access User Management

1. Click on "User Management" in the admin sidebar
2. Verify you can see the list of users including the test restaurant owner

### 3. Test Subscription Plan Change

1. Find the restaurant owner user in the list
2. Click on the "Change Plan" dropdown button (Crown icon)
3. Select either "Switch to Basic" or "Switch to Pro"
4. Verify the change is reflected immediately in the UI
5. Check that the backend API call was successful (no error messages)

### 4. Verify Database Persistence

1. Refresh the page
2. Verify the subscription plan change persists
3. The user's subscription plan should show the updated value

### 5. Test Real-time Context Update

1. If you change the plan for the currently logged-in user, verify that:
   - The user context is updated immediately
   - No page refresh is required
   - The change is reflected across the application

## API Endpoints Tested

- `POST /api/auth/login` - Admin authentication
- `GET /api/admin/users` - Fetch all users
- `PUT /api/admin/users/{id}/plan` - Update user subscription plan

## Database Integration

The subscription changes are persisted to the Supabase database through:

1. **AdminService.updateUserPlan()** - Updates the restaurant's subscription plan
2. **RestaurantRepository.save()** - Persists changes to the database
3. **UserManagementDTO** - Returns updated user data with new subscription plan

## Frontend Integration

The frontend properly handles subscription changes through:

1. **useApiMutation** - Calls the backend API
2. **AuthContext.updateUserPlan()** - Updates user context if current user
3. **Real-time UI updates** - Immediate reflection of changes
4. **localStorage persistence** - Maintains state across sessions

## Expected Results

✅ Super Admin can successfully change restaurant subscription plans
✅ Changes are immediately reflected in the UI
✅ Changes persist to the Supabase database
✅ User context is updated for the current user
✅ No page refresh required for updates
✅ Error handling for failed API calls
