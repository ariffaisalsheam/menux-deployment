import { adminAPI } from './api';
import type { EnhancedNotification } from '../types/notifications';

interface BaseNotification {
  id: number;
  targetUserId?: number;
  restaurantId?: number;
  type: string;
  title: string;
  body: string;
  data?: string;
  priority: string;
  status: string;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Enhance notifications with additional context information
 */
export class NotificationEnhancer {
  private userCache = new Map<number, any>();
  private restaurantCache = new Map<number, any>();

  /**
   * Enhance a single notification with context information
   */
  async enhanceNotification(notification: BaseNotification): Promise<EnhancedNotification> {
    const enhanced: EnhancedNotification = {
      ...notification,
      type: notification.type as any,
      priority: notification.priority as any,
      status: notification.status as any,
    };

    // Parse JSON data if available
    if (notification.data) {
      try {
        enhanced.parsedData = JSON.parse(notification.data);
      } catch (error) {
        console.warn('Failed to parse notification data:', error);
      }
    }

    // Fetch user context if targetUserId is available
    if (notification.targetUserId) {
      try {
        enhanced.targetUser = await this.getUserDetails(notification.targetUserId);
      } catch (error) {
        console.warn('Failed to fetch user details:', error);
      }
    }

    // Fetch restaurant context if restaurantId is available
    if (notification.restaurantId) {
      try {
        enhanced.restaurant = await this.getRestaurantDetails(notification.restaurantId);
      } catch (error) {
        console.warn('Failed to fetch restaurant details:', error);
      }
    }

    return enhanced;
  }

  /**
   * Enhance multiple notifications with context information
   */
  async enhanceNotifications(notifications: BaseNotification[]): Promise<EnhancedNotification[]> {
    // Pre-fetch all unique user and restaurant IDs to minimize API calls
    const userIds = new Set<number>();
    const restaurantIds = new Set<number>();

    notifications.forEach(notification => {
      if (notification.targetUserId) userIds.add(notification.targetUserId);
      if (notification.restaurantId) restaurantIds.add(notification.restaurantId);
    });

    // Pre-fetch user and restaurant data
    await Promise.all([
      this.prefetchUsers(Array.from(userIds)),
      this.prefetchRestaurants(Array.from(restaurantIds)),
    ]);

    // Enhance all notifications
    return Promise.all(
      notifications.map(notification => this.enhanceNotification(notification))
    );
  }

  /**
   * Get user details with caching
   */
  private async getUserDetails(userId: number) {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId);
    }

    try {
      const user = await adminAPI.getUserDetails(userId);
      this.userCache.set(userId, user);
      return user;
    } catch (error) {
      // Return fallback user info if API call fails
      const fallback = {
        id: userId,
        fullName: `User ${userId}`,
        email: 'unknown@example.com',
        role: 'UNKNOWN',
      };
      this.userCache.set(userId, fallback);
      return fallback;
    }
  }

  /**
   * Get restaurant details with caching
   */
  private async getRestaurantDetails(restaurantId: number) {
    if (this.restaurantCache.has(restaurantId)) {
      return this.restaurantCache.get(restaurantId);
    }

    try {
      const restaurant = await adminAPI.getRestaurantDetails(restaurantId);
      this.restaurantCache.set(restaurantId, restaurant);
      return restaurant;
    } catch (error) {
      // Return fallback restaurant info if API call fails
      const fallback = {
        id: restaurantId,
        name: `Restaurant ${restaurantId}`,
        address: 'Unknown address',
        phone: 'Unknown phone',
      };
      this.restaurantCache.set(restaurantId, fallback);
      return fallback;
    }
  }

  /**
   * Pre-fetch multiple users to populate cache
   */
  private async prefetchUsers(userIds: number[]) {
    const uncachedIds = userIds.filter(id => !this.userCache.has(id));
    
    if (uncachedIds.length === 0) return;

    // Fetch users in parallel with error handling
    const userPromises = uncachedIds.map(async (userId) => {
      try {
        const user = await adminAPI.getUserDetails(userId);
        this.userCache.set(userId, user);
      } catch (error) {
        // Set fallback for failed requests
        this.userCache.set(userId, {
          id: userId,
          fullName: `User ${userId}`,
          email: 'unknown@example.com',
          role: 'UNKNOWN',
        });
      }
    });

    await Promise.allSettled(userPromises);
  }

  /**
   * Pre-fetch multiple restaurants to populate cache
   */
  private async prefetchRestaurants(restaurantIds: number[]) {
    const uncachedIds = restaurantIds.filter(id => !this.restaurantCache.has(id));
    
    if (uncachedIds.length === 0) return;

    // Fetch restaurants in parallel with error handling
    const restaurantPromises = uncachedIds.map(async (restaurantId) => {
      try {
        const restaurant = await adminAPI.getRestaurantDetails(restaurantId);
        this.restaurantCache.set(restaurantId, restaurant);
      } catch (error) {
        // Set fallback for failed requests
        this.restaurantCache.set(restaurantId, {
          id: restaurantId,
          name: `Restaurant ${restaurantId}`,
          address: 'Unknown address',
          phone: 'Unknown phone',
        });
      }
    });

    await Promise.allSettled(restaurantPromises);
  }

  /**
   * Clear caches (useful for testing or memory management)
   */
  clearCache() {
    this.userCache.clear();
    this.restaurantCache.clear();
  }
}

// Export a singleton instance
export const notificationEnhancer = new NotificationEnhancer();
