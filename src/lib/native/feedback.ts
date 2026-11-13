import { Capacitor } from '@capacitor/core';
import type { Settings } from '@/lib/ord/engine';
// Legacy sound settings remain readable in saves, but feedback is haptic-only.
export async function feedback(settings: Settings, success = false) {
  if (!settings.haptics) return;
  try {
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
      if (success) await Haptics.notification({ type: NotificationType.Success });
      else await Haptics.impact({ style: ImpactStyle.Light });
    } else navigator.vibrate?.(success ? [10,40,20] : 5);
  } catch { /* Gameplay never depends on feedback or device support. */ }
}
