// server/services/notification.service.ts
import { db } from '../utils/db';
import { stockAlerts, products, settings } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Notification Service
 * Handles all notification-related operations
 */
export class NotificationService {
  /**
   * Check stock levels and create alerts
   */
  static async checkStockLevels(): Promise<void> {
    try {
      // Get all products with their current stock
      const allProducts = await db.select().from(products);
      
      // Get system settings for threshold
      const systemSettings = await db.select().from(settings).limit(1);
      const defaultThreshold = systemSettings[0]?.lowStockThreshold || 5;

      for (const product of allProducts) {
        const threshold = product.minStock || defaultThreshold;
        
        // Check if alert already exists for this product
        const existingAlert = await db
          .select()
          .from(stockAlerts)
          .where(
            and(
              eq(stockAlerts.productId, product.id),
              eq(stockAlerts.isSeen, false)
            )
          )
          .limit(1);

        // Determine alert type
        let alertType: 'low' | 'out' | null = null;
        
        if (product.quantity === 0) {
          alertType = 'out';
        } else if (product.quantity <= threshold) {
          alertType = 'low';
        }

        if (alertType) {
          // Create or update alert if it doesn't exist
          if (existingAlert.length === 0) {
            await db.insert(stockAlerts).values({
              productId: product.id,
              currentQuantity: product.quantity,
              threshold: threshold,
              alertType: alertType,
              isSeen: false,
            });
          }
        } else {
          // Remove alert if stock is back to normal
          if (existingAlert.length > 0) {
            await db
              .delete(stockAlerts)
              .where(eq(stockAlerts.productId, product.id));
          }
        }
      }
    } catch (error) {
      console.error('Error checking stock levels:', error);
      throw error;
    }
  }

  /**
   * Get all notifications (stock alerts)
   */
  static async getNotifications(includesSeen: boolean = false) {
    try {
      const query = db
        .select({
          id: stockAlerts.id,
          productId: stockAlerts.productId,
          productName: products.name,
          productSku: products.sku,
          currentQuantity: stockAlerts.currentQuantity,
          threshold: stockAlerts.threshold,
          alertType: stockAlerts.alertType,
          isSeen: stockAlerts.isSeen,
          createdAt: stockAlerts.createdAt,
        })
        .from(stockAlerts)
        .innerJoin(products, eq(stockAlerts.productId, products.id))
        .orderBy(desc(stockAlerts.createdAt));

      if (!includesSeen) {
        return await query.where(eq(stockAlerts.isSeen, false));
      }

      return await query;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification count
   */
  static async getNotificationCount(): Promise<number> {
    try {
      const notifications = await db
        .select()
        .from(stockAlerts)
        .where(eq(stockAlerts.isSeen, false));
      
      return notifications.length;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as seen
   */
  static async markAsSeen(notificationId: number): Promise<void> {
    try {
      await db
        .update(stockAlerts)
        .set({ isSeen: true })
        .where(eq(stockAlerts.id, notificationId));
    } catch (error) {
      console.error('Error marking notification as seen:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as seen
   */
  static async markAllAsSeen(): Promise<void> {
    try {
      await db
        .update(stockAlerts)
        .set({ isSeen: true })
        .where(eq(stockAlerts.isSeen, false));
    } catch (error) {
      console.error('Error marking all notifications as seen:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: number): Promise<void> {
    try {
      await db
        .delete(stockAlerts)
        .where(eq(stockAlerts.id, notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all seen notifications
   */
  static async deleteSeenNotifications(): Promise<void> {
    try {
      await db
        .delete(stockAlerts)
        .where(eq(stockAlerts.isSeen, true));
    } catch (error) {
      console.error('Error deleting seen notifications:', error);
      throw error;
    }
  }
}