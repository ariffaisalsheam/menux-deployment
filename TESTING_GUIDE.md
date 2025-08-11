# Menu.X Dashboard Testing Guide

## 🎯 Overview

This guide provides comprehensive instructions for testing the Menu.X restaurant management system with different user roles and subscription plans.

## 🔐 User Accounts

### Super Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Super Admin
- **Access:** Full platform management

### Restaurant Owner Account
- **Username:** `testuser456`
- **Password:** `password123`
- **Role:** Restaurant Owner
- **Plan:** Basic (can be switched to Pro)
- **Restaurant:** Test Restaurant 456

## 🚀 Quick Start Testing

### Method 1: Admin Dashboard (Recommended)

1. **Login as Super Admin:**
   - Go to `http://localhost:5173/login`
   - Username: `admin`
   - Password: `admin123`
   - You'll be redirected to `/admin`

2. **Use Testing Interface:**
   - Navigate to `/admin/testing`
   - Use the "Switch Test User" buttons to test different scenarios
   - Switch between Basic and Pro plans instantly

3. **User Management:**
   - Go to `/admin/users`
   - View all users and their subscription plans
   - Use "Switch To User" to test as any restaurant owner
   - Use "Change Plan" to modify subscription plans

### Method 2: Browser Console Commands

Open browser console (F12) and use these commands:

```javascript
// Switch to Basic plan user
simulateBasicUser()

// Switch to Pro plan user  
simulateProUser()

// Switch to Super Admin
simulateAdminUser()

// Clear test data
clearTestData()
```

## 📊 Testing Scenarios

### 1. Basic Plan Testing

**Goal:** Verify Basic plan features and Pro upgrade prompts

**Steps:**
1. Login as restaurant owner or use admin testing interface
2. Ensure user has Basic plan
3. Test these sections:
   - `/dashboard` - Overview with upgrade prompts
   - `/dashboard/profile` - Restaurant profile management
   - `/dashboard/menu` - Menu management with AI writer promotion
   - `/dashboard/orders` - Order history with live orders promotion
   - `/dashboard/analytics` - Basic analytics with advanced promotion

**Expected Results:**
- ✅ All Basic features accessible
- ✅ Pro upgrade prompts visible
- ✅ Crown icons on Pro features
- ✅ "Pro Feature" badges displayed
- ✅ Pricing information (৳1,500/month) shown

### 2. Pro Plan Testing

**Goal:** Verify all Pro features are accessible

**Steps:**
1. Switch user to Pro plan via admin interface or console
2. Test these sections:
   - `/dashboard/live-orders` - Live order management
   - `/dashboard/ai-menu` - AI menu writer
   - `/dashboard/feedback` - Feedback analysis
   - `/dashboard/advanced-analytics` - Advanced analytics
   - `/dashboard/notifications` - Notification center

**Expected Results:**
- ✅ All Basic features still accessible
- ✅ Pro features fully functional
- ✅ No upgrade prompts shown
- ✅ "Pro Active" badges displayed
- ✅ Advanced interfaces load properly

### 3. Plan Switching Testing

**Goal:** Verify seamless plan switching

**Steps:**
1. Start with Basic plan user
2. Note available features and upgrade prompts
3. Switch to Pro plan (via admin or console)
4. Verify new features unlock immediately
5. Switch back to Basic plan
6. Confirm feature restrictions return

**Expected Results:**
- ✅ Immediate plan changes without page refresh
- ✅ Feature access updates correctly
- ✅ Visual indicators change appropriately
- ✅ No broken functionality during switches

### 4. Super Admin Testing

**Goal:** Verify admin dashboard functionality

**Steps:**
1. Login as Super Admin
2. Test these sections:
   - `/admin` - Platform overview
   - `/admin/users` - User management
   - `/admin/restaurants` - Restaurant management
   - `/admin/plans` - Plan management
   - `/admin/analytics` - Platform analytics
   - `/admin/testing` - Testing interface

**Expected Results:**
- ✅ Platform statistics display correctly
- ✅ User management functions work
- ✅ Plan switching affects users immediately
- ✅ Testing interface provides easy user switching

## 🔧 Navigation Testing

Test all dashboard routes for proper access control:

### Restaurant Owner Routes
- `/dashboard` - Overview
- `/dashboard/profile` - Restaurant Profile  
- `/dashboard/menu` - Menu Management
- `/dashboard/orders` - Order History
- `/dashboard/analytics` - Basic Analytics
- `/dashboard/live-orders` - Live Orders (Pro only)
- `/dashboard/ai-menu` - AI Menu Writer (Pro only)
- `/dashboard/feedback` - Feedback Analysis (Pro only)
- `/dashboard/advanced-analytics` - Advanced Analytics (Pro only)
- `/dashboard/notifications` - Notifications (Pro only)

### Super Admin Routes
- `/admin` - Admin Overview
- `/admin/users` - User Management
- `/admin/restaurants` - Restaurant Management
- `/admin/plans` - Plan Management
- `/admin/analytics` - Platform Analytics
- `/admin/testing` - Testing Interface

## 📱 Visual Verification Checklist

### Basic Plan Users
- [ ] Crown icons visible on Pro features in sidebar
- [ ] "Pro Feature" badges displayed
- [ ] Upgrade cards show in each section
- [ ] Pricing information (৳1,500/month) displayed
- [ ] "Basic" plan badge in headers
- [ ] Upgrade CTAs are prominent and clickable

### Pro Plan Users
- [ ] All features accessible without restrictions
- [ ] "Pro Active" badges displayed
- [ ] No upgrade prompts shown
- [ ] Crown icons indicate active Pro features
- [ ] Advanced interfaces load properly

### Super Admin Users
- [ ] Red "Super Admin" badges displayed
- [ ] Shield icons in admin interface
- [ ] All admin sections accessible
- [ ] User switching functions work
- [ ] Plan management affects users immediately

## 🐛 Common Issues & Solutions

### Issue: Plan changes don't take effect
**Solution:** Use the admin testing interface or ensure page refresh after console commands

### Issue: Admin dashboard not accessible
**Solution:** Ensure you're logged in as Super Admin (username: admin, password: admin123)

### Issue: Features not updating after plan switch
**Solution:** Clear browser cache or use incognito mode

### Issue: Console commands not working
**Solution:** Ensure you're on a page that has loaded the test utilities

## 🚀 Production Readiness

The system is ready for:
- ✅ Real user authentication
- ✅ Payment system integration
- ✅ Gemini AI API integration
- ✅ Real-time features implementation
- ✅ Production deployment

## 📞 Support

For testing issues or questions:
1. Check this guide first
2. Use the admin testing interface for user switching
3. Clear test data if experiencing issues
4. Restart the application if needed

---

**Happy Testing! 🎉**
