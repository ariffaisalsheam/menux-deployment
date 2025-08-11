// Test utilities for simulating different user plans and scenarios

export const createTestUser = (plan: 'BASIC' | 'PRO' = 'BASIC') => {
  const baseUser = {
    id: 3,
    username: 'testuser456',
    email: 'testuser456@example.com',
    fullName: 'Test User 456',
    role: 'RESTAURANT_OWNER' as const,
    restaurantId: 3,
    restaurantName: 'Test Restaurant 456'
  };

  return {
    ...baseUser,
    subscriptionPlan: plan
  };
};

// Function to simulate switching plans for testing
export const simulateProUser = () => {
  const proUser = createTestUser('PRO');

  // Store in localStorage for testing
  localStorage.setItem('test_user_plan', 'PRO');
  localStorage.setItem('test_user_data', JSON.stringify(proUser));

  console.log('🎉 Simulating Pro User:', proUser);

  // Trigger a page reload to apply changes
  setTimeout(() => {
    window.location.reload();
  }, 500);

  return proUser;
};

export const simulateBasicUser = () => {
  const basicUser = createTestUser('BASIC');

  // Store in localStorage for testing
  localStorage.setItem('test_user_plan', 'BASIC');
  localStorage.setItem('test_user_data', JSON.stringify(basicUser));

  console.log('📝 Simulating Basic User:', basicUser);

  // Trigger a page reload to apply changes
  setTimeout(() => {
    window.location.reload();
  }, 500);

  return basicUser;
};

export const simulateAdminUser = () => {
  const adminUser = {
    id: 5,
    username: 'admin',
    email: 'admin@menux.com',
    fullName: 'System Administrator',
    role: 'SUPER_ADMIN' as const,
    restaurantId: undefined,
    restaurantName: undefined,
    subscriptionPlan: undefined
  };

  // Store in localStorage for testing
  localStorage.setItem('test_user_data', JSON.stringify(adminUser));

  console.log('🔐 Simulating Admin User:', adminUser);

  // Navigate to admin dashboard
  setTimeout(() => {
    window.location.href = '/admin';
  }, 500);

  return adminUser;
};

// Function to get current test plan
export const getCurrentTestPlan = (): 'BASIC' | 'PRO' | null => {
  return localStorage.getItem('test_user_plan') as 'BASIC' | 'PRO' | null;
};

// Function to clear test data
export const clearTestData = () => {
  localStorage.removeItem('test_user_plan');
  localStorage.removeItem('test_user_data');
  console.log('🧹 Test data cleared');
};

// Mock data generators for testing
export const generateMockOrders = (count: number = 10) => {
  const statuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
  const items = ['Chicken Biryani', 'Beef Bhuna', 'Fish Curry', 'Vegetable Samosa', 'Mutton Curry'];
  const customers = ['Ahmed Rahman', 'Fatima Khan', 'Mohammad Ali', 'Rashida Begum', 'Karim Uddin'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `ORD-${String(i + 1).padStart(3, '0')}`,
    customerName: customers[Math.floor(Math.random() * customers.length)],
    items: [items[Math.floor(Math.random() * items.length)]],
    total: Math.floor(Math.random() * 500) + 200,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: `${Math.floor(Math.random() * 12) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
    paymentMethod: ['Cash', 'bKash', 'Nagad', 'Card'][Math.floor(Math.random() * 4)]
  }));
};

export const generateMockFeedback = (count: number = 20) => {
  const sentiments = ['positive', 'negative', 'neutral'];
  const comments = [
    'Amazing food and great service!',
    'The biryani was absolutely delicious.',
    'Could improve the delivery time.',
    'Excellent taste and quality.',
    'Food was cold when delivered.',
    'Best restaurant in the area!',
    'Good food but expensive.',
    'Quick service and tasty food.',
    'Not satisfied with the portion size.',
    'Will definitely order again!'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    customerName: `Customer ${i + 1}`,
    rating: Math.floor(Math.random() * 5) + 1,
    comment: comments[Math.floor(Math.random() * comments.length)],
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    orderId: `ORD-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`
  }));
};

// Testing scenarios
export const testScenarios = {
  basicUser: {
    name: 'Basic Plan User',
    description: 'Test all Basic features and Pro upgrade prompts',
    setup: simulateBasicUser,
    features: [
      'Restaurant Profile Management',
      'Basic Menu Management',
      'Order History (Read-only)',
      'Basic Analytics',
      'Pro Feature Upgrade Prompts'
    ]
  },
  
  proUser: {
    name: 'Pro Plan User',
    description: 'Test all Pro features and advanced functionality',
    setup: simulateProUser,
    features: [
      'All Basic Features',
      'Live Order Management',
      'AI Menu Writer',
      'AI Feedback Analysis',
      'Advanced Analytics',
      'Real-time Notifications'
    ]
  }
};

// Console helper for testing
export const logTestInstructions = () => {
  console.log(`
🧪 MENU.X DASHBOARD TESTING GUIDE
================================

To test different user plans, use these commands in the browser console:

📝 BASIC PLAN TESTING:
simulateBasicUser() - Switch to Basic plan user
- Test restaurant profile management
- Test basic menu management
- Test order history (read-only)
- Test basic analytics
- Verify Pro upgrade prompts appear

🎉 PRO PLAN TESTING:
simulateProUser() - Switch to Pro plan user  
- Test all Basic features
- Test live order management
- Test AI menu writer
- Test AI feedback analysis
- Test advanced analytics
- Test notification center

🔄 RESET TESTING:
clearTestData() - Clear all test data
location.reload() - Refresh to apply changes

📍 NAVIGATION TESTING:
Visit these URLs to test different sections:
- /dashboard - Overview
- /dashboard/profile - Restaurant Profile
- /dashboard/menu - Menu Management
- /dashboard/orders - Order History
- /dashboard/analytics - Basic Analytics
- /dashboard/live-orders - Live Orders (Pro)
- /dashboard/ai-menu - AI Menu Writer (Pro)
- /dashboard/feedback - Feedback Analysis (Pro)
- /dashboard/advanced-analytics - Advanced Analytics (Pro)
- /dashboard/notifications - Notifications (Pro)

✅ WHAT TO VERIFY:
1. Basic users see upgrade prompts for Pro features
2. Pro users have full access to all features
3. Navigation works correctly
4. Visual indicators (Crown icons, Pro badges) display properly
5. Responsive design works on mobile and desktop
6. Loading states and error handling work
7. Plan-based feature access is enforced
  `);
};

// Auto-log instructions when this file is imported
if (typeof window !== 'undefined') {
  // Make functions globally available for testing
  (window as any).simulateBasicUser = simulateBasicUser;
  (window as any).simulateProUser = simulateProUser;
  (window as any).simulateAdminUser = simulateAdminUser;
  (window as any).clearTestData = clearTestData;
  (window as any).logTestInstructions = logTestInstructions;
  (window as any).testScenarios = testScenarios;
}
