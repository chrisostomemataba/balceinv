// server/api/notifications/count.get.ts
import { NotificationService } from '../../services/notification.service';

/**
 * GET /api/notifications/count
 * Get unread notification count
 */
export default defineEventHandler(async (event) => {
  try {
    // Check stock levels first
    await NotificationService.checkStockLevels();
    
    // Get count
    const count = await NotificationService.getNotificationCount();

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('Error fetching notification count:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch notification count',
    });
  }
});