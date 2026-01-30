// server/api/notifications/[id]/index.delete.ts
import { NotificationService } from '../../services/notification.service';

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Notification ID is required',
      });
    }

    const notificationId = parseInt(id);
    
    if (isNaN(notificationId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid notification ID',
      });
    }

    await NotificationService.deleteNotification(notificationId);

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to delete notification',
    });
  }
});