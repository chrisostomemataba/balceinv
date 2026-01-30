// server/api/notifications/clear-seen.delete.ts
import { NotificationService } from '../../services/notification.service';

/**
 * DELETE /api/notifications/clear-seen
 * Delete all seen notifications
 */
export default defineEventHandler(async (event) => {
  try {
    await NotificationService.deleteSeenNotifications();

    return {
      success: true,
      message: 'Seen notifications cleared successfully',
    };
  } catch (error) {
    console.error('Error clearing seen notifications:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to clear seen notifications',
    });
  }
});