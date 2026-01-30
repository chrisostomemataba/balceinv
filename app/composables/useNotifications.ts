// composables/useNotifications.ts
import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';

/**
 * Notification type definition
 */
export interface Notification {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  currentQuantity: number;
  threshold: number;
  alertType: 'low' | 'out';
  isSeen: boolean;
  createdAt: Date;
}

/**
 * Composable for managing notifications
 */
export const useNotifications = () => {
  // State
  const notifications = ref<Notification[]>([]);
  const notificationCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const soundEnabled = ref(true);

  // Audio context for notification sound
  let audioContext: AudioContext | null = null;

  /**
   * Initialize audio context
   */
  const initAudio = () => {
    if (process.client && !audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  /**
   * Play notification sound
   */
  const playNotificationSound = () => {
    if (!soundEnabled.value || !process.client) return;

    try {
      initAudio();
      if (!audioContext) return;

      // Create a simple beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // Second beep
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.frequency.value = 1000; // Hz
      oscillator2.type = 'sine';
      gainNode2.gain.value = 0.3;

      oscillator2.start(audioContext.currentTime + 0.25);
      oscillator2.stop(audioContext.currentTime + 0.45);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  /**
   * Fetch all notifications
   */
  const fetchNotifications = async (includeSeen: boolean = false) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/notifications', {
        query: { includeSeen: includeSeen.toString() },
      });

      if ((response as any).success) {
        const oldCount = notificationCount.value;
        notifications.value = (response as any).data;
        notificationCount.value = (response as any).data.filter((n: Notification) => !n.isSeen).length;

        // Play sound if new notifications arrived
        if (notificationCount.value > oldCount && oldCount > 0) {
          playNotificationSound();
        }
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch notifications';
      toast.error('Failed to fetch notifications', {
        description: err.message || 'Please try again later',
      });
      console.error('Error fetching notifications:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch notification count only
   */
  const fetchNotificationCount = async () => {
    try {
      const response = await $fetch('/api/notifications/count');
      
      if ((response as any).success) {
        const oldCount = notificationCount.value;
        notificationCount.value = (response as any).count;

        // Play sound if count increased
        if (notificationCount.value > oldCount && oldCount > 0) {
          playNotificationSound();
        }
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  /**
   * Mark notification as seen
   */
  const markAsSeen = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();

      if (result.success) {
        // Update local state
        const notification = notifications.value.find(n => n.id === notificationId);
        if (notification) {
          notification.isSeen = true;
          notificationCount.value = Math.max(0, notificationCount.value - 1);
        }
      }
    } catch (err: any) {
      toast.error('Failed to mark notification as read', {
        description: err.message || 'Please try again',
      });
      console.error('Error marking notification as seen:', err);
      throw err;
    }
  };

  /**
   * Mark all notifications as seen
   */
  const markAllAsSeen = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();

      if (result.success) {
        // Update local state
        notifications.value.forEach(n => n.isSeen = true);
        notificationCount.value = 0;
      }
    } catch (err: any) {
      toast.error('Failed to mark all notifications as read', {
        description: err.message || 'Please try again',
      });
      console.error('Error marking all notifications as seen:', err);
      throw err;
    }
  };

  /**
   * Delete a notification
   */
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await $fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if ((response as any).success) {
        // Update local state
        const index = notifications.value.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          const wasUnseen = !notifications.value[index]?.isSeen;
          notifications.value.splice(index, 1);
          
          if (wasUnseen) {
            notificationCount.value = Math.max(0, notificationCount.value - 1);
          }
        }
      }
    } catch (err: any) {
      toast.error('Failed to delete notification', {
        description: err.message || 'Please try again',
      });
      console.error('Error deleting notification:', err);
      throw err;
    }
  };

  /**
   * Clear all seen notifications
   */
  const clearSeenNotifications = async () => {
    try {
      const response = await $fetch('/api/notifications/clear-seen', {
        method: 'DELETE',
      });

      if ((response as any).success) {
        // Update local state - remove seen notifications
        notifications.value = notifications.value.filter(n => !n.isSeen);
      }
    } catch (err: any) {
      toast.error('Failed to clear notifications', {
        description: err.message || 'Please try again',
      });
      console.error('Error clearing seen notifications:', err);
      throw err;
    }
  };

  /**
   * Toggle sound setting
   */
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value;
    if (process.client) {
      localStorage.setItem('notification-sound-enabled', soundEnabled.value.toString());
    }
  };

  /**
   * Load sound setting from localStorage
   */
  const loadSoundSetting = () => {
    if (process.client) {
      const saved = localStorage.getItem('notification-sound-enabled');
      if (saved !== null) {
        soundEnabled.value = saved === 'true';
      }
    }
  };

  // Computed
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.isSeen)
  );

  const hasUnread = computed(() => notificationCount.value > 0);

  return {
    // State
    notifications,
    notificationCount,
    loading,
    error,
    soundEnabled,
    
    // Computed
    unreadNotifications,
    hasUnread,
    
    // Methods
    fetchNotifications,
    fetchNotificationCount,
    markAsSeen,
    markAllAsSeen,
    deleteNotification,
    clearSeenNotifications,
    playNotificationSound,
    toggleSound,
    loadSoundSetting,
  };
};