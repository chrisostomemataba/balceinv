// server/api/notifications/[id]/mark-seen.post.ts
import { NotificationService } from '../../services/notification.service';

/**
 * POST /api/notifications/[id]/mark-seen
 * Mark a notification as seen
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

    await NotificationService.markAsSeen(notificationId);

    return {
      success: true,
      message: 'Notification marked as seen',
    };
  } catch (error) {
    console.error('Error marking notification as seen:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to mark notification as seen',
    });
  }
});