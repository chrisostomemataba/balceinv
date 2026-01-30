// server/api/notifications/index.get.ts
import { NotificationService } from '../../services/notification.service';

/**
 * GET /api/notifications
 * Get all notifications
 */
export default defineEventHandler(async (event) => {
  try {
    // Get query parameter to include seen notifications
    const query = getQuery(event);
    const includeSeen = query.includeSeen === 'true';

    // Check stock levels before fetching notifications
    await NotificationService.checkStockLevels();

    // Get notifications
    const notifications = await NotificationService.getNotifications(includeSeen);

    return {
      success: true,
      data: notifications,
      count: notifications.length,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch notifications',
    });
  }
});