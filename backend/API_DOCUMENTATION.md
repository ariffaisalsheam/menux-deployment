# Menu.X API Documentation

## Overview
This document provides comprehensive documentation for the Menu.X restaurant management system API endpoints.

## Authentication
All protected endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Base URL
```
http://localhost:8080/api
```

## Authentication Endpoints

### POST /auth/login
Login with username and password.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "fullName": "string",
    "role": "SUPER_ADMIN|RESTAURANT_OWNER",
    "restaurantId": 1,
    "restaurantName": "string",
    "subscriptionPlan": "BASIC|PRO"
  }
}
```

### POST /auth/register
Register a new restaurant owner.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "fullName": "string",
  "restaurantName": "string",
  "restaurantAddress": "string",
  "restaurantDescription": "string"
}
```

## Admin Endpoints (SUPER_ADMIN only)

### User Management

#### GET /admin/users
Get all users in the system.

**Response:**
```json
[
  {
    "id": 1,
    "username": "string",
    "email": "string",
    "fullName": "string",
    "role": "RESTAURANT_OWNER",
    "restaurantName": "string",
    "subscriptionPlan": "BASIC|PRO",
    "status": "active",
    "joinDate": "2024-01-01T00:00:00",
    "lastLogin": "2024-01-01T00:00:00"
  }
]
```

#### GET /admin/users/{id}
Get specific user by ID.

#### PUT /admin/users/{id}/plan
Update user's subscription plan.

**Request Body:**
```json
{
  "subscriptionPlan": "BASIC|PRO"
}
```

#### DELETE /admin/users/{id}
Delete a user and their associated restaurant.

### Restaurant Management

#### GET /admin/restaurants
Get all restaurants in the system.

**Response:**
```json
[
  {
    "id": 1,
    "name": "string",
    "description": "string",
    "address": "string",
    "phone": "string",
    "email": "string",
    "subscriptionPlan": "BASIC|PRO",
    "status": "active",
    "joinDate": "2024-01-01T00:00:00",
    "ownerName": "string",
    "ownerEmail": "string",
    "totalOrders": 0,
    "monthlyRevenue": 0.0
  }
]
```

#### GET /admin/restaurants/{id}
Get specific restaurant by ID.

### Platform Analytics

#### GET /admin/analytics
Get platform-wide analytics.

**Response:**
```json
{
  "totalUsers": 100,
  "totalRestaurants": 50,
  "proSubscriptions": 25,
  "basicSubscriptions": 25,
  "monthlyRevenue": 37500.0,
  "activeUsers": 95,
  "systemHealth": 99.8,
  "totalOrders": 1000,
  "conversionRate": 50.0
}
```

### AI Configuration

#### GET /admin/ai-config
Get all AI provider configurations.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Google Gemini",
    "type": "GOOGLE_GEMINI",
    "maskedApiKey": "****abcd",
    "endpoint": null,
    "isActive": true,
    "isPrimary": true,
    "settings": "{}",
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00",
    "lastTestedAt": "2024-01-01T00:00:00",
    "testStatus": "SUCCESS",
    "testErrorMessage": null
  }
]
```

#### POST /admin/ai-config
Create a new AI provider configuration.

**Request Body:**
```json
{
  "name": "My AI Provider",
  "type": "GOOGLE_GEMINI|OPENROUTER|OPENAI|OPENAI_COMPATIBLE|Z_AI_GLM_4_5",
  "apiKey": "actual_api_key",
  "endpoint": "https://api.example.com",
  "isActive": true,
  "isPrimary": false,
  "settings": "{\"model\": \"gpt-3.5-turbo\"}"
}
```

#### PUT /admin/ai-config/{id}
Update an AI provider configuration.

#### DELETE /admin/ai-config/{id}
Delete an AI provider configuration.

#### POST /admin/ai-config/{id}/test
Test an AI provider configuration.

**Response:**
```json
{
  "success": true,
  "message": "Provider test successful",
  "status": "SUCCESS",
  "testedAt": "2024-01-01T00:00:00",
  "responseTimeMs": 1500,
  "usageInfo": "API call successful"
}
```

#### POST /admin/ai-config/{id}/set-primary
Set an AI provider as the primary provider.

## Restaurant Owner Endpoints

### Restaurant Management

#### GET /restaurants/current
Get current user's restaurant information.

**Response:**
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "address": "string",
  "phoneNumber": "string",
  "email": "string",
  "subscriptionPlan": "BASIC|PRO",
  "openingHours": "string",
  "cuisine": "string"
}
```

#### PUT /restaurants/{id}
Update restaurant information.

### Menu Management

#### GET /menu
Get menu items for current restaurant.

**Response:**
```json
[
  {
    "id": 1,
    "name": "string",
    "description": "string",
    "price": 299.99,
    "category": "string",
    "available": true,
    "image": "string"
  }
]
```

#### POST /menu
Create a new menu item.

#### PUT /menu/{id}
Update a menu item.

#### DELETE /menu/{id}
Delete a menu item.

### Order Management

#### GET /orders
Get orders for current restaurant.

**Response:**
```json
[
  {
    "id": "ORD-001",
    "customerName": "string",
    "items": ["item1", "item2"],
    "total": 599.99,
    "status": "pending|preparing|ready|completed|cancelled",
    "date": "2024-01-01",
    "time": "12:30 PM",
    "paymentMethod": "cash|card|bkash|nagad"
  }
]
```

#### PUT /orders/{id}/status
Update order status.

### Analytics

#### GET /analytics/restaurant
Get analytics for current restaurant.

**Response:**
```json
{
  "revenue": {
    "current": 45231,
    "previous": 41650,
    "change": 8.6
  },
  "orders": {
    "current": 1234,
    "previous": 1102,
    "change": 12.0
  },
  "customers": {
    "current": 573,
    "previous": 498,
    "change": 15.1
  },
  "rating": {
    "current": 4.8,
    "previous": 4.6,
    "change": 4.3
  },
  "topSellingItems": [
    {
      "name": "Chicken Biryani",
      "orders": 156,
      "revenue": 54600
    }
  ],
  "weeklyTrends": [
    {
      "period": "This Week",
      "revenue": 12500,
      "orders": 89,
      "change": 15.2
    }
  ]
}
```

## AI Services (PRO only)

### POST /ai/menu-description
Generate AI-powered menu item description.

**Request Body:**
```json
{
  "itemName": "Chicken Biryani"
}
```

**Response:**
```json
{
  "description": "Aromatic basmati rice layered with tender spiced chicken, creating a symphony of flavors that will transport you to culinary paradise."
}
```

### POST /ai/feedback-analysis
Analyze customer feedback using AI.

**Request Body:**
```json
{
  "feedback": "The food was amazing but service was slow"
}
```

**Response:**
```json
{
  "sentiment": "Mixed",
  "summary": "Positive feedback on food quality, negative feedback on service speed",
  "keyPoints": ["excellent food", "slow service"],
  "suggestions": ["Improve service efficiency while maintaining food quality"]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-01-01T00:00:00"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- AI services: 10 requests per minute (PRO users)
- Other endpoints: 100 requests per minute

## Security

- All API keys are encrypted using AES-256
- JWT tokens expire after 24 hours
- HTTPS required in production
- Input validation on all endpoints
- SQL injection prevention
- XSS protection
