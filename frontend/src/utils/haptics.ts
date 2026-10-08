/**
 * Telegram WebApp Haptic Feedback and Utility helpers
 */

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error') => {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;

    switch (type) {
      case 'light':
      case 'medium':
      case 'heavy':
      case 'rigid':
      case 'soft':
        tg.HapticFeedback.impactOccurred(type);
        break;
      case 'success':
      case 'warning':
      case 'error':
        tg.HapticFeedback.notificationOccurred(type);
        break;
      default:
        break;
    }
  } catch (e) {
    // Silently ignore if not supported
  }
};
