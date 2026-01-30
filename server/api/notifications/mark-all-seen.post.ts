// server/api/notifications/mark-all-seen.post.ts
import { NotificationService } from '../../services/notification.service';

/**
 * POST /api/notifications/mark-all-seen
 * Mark all notifications as seen
 */
export default defineEventHandler(async (event) => {
  try {
    await NotificationService.markAllAsSeen();

    return {
      success: true,
      message: 'All notifications marked as seen',
    };
  } catch (error) {
    console.error('Error marking all notifications as seen:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to mark all notifications as seen',
    });
  }
});