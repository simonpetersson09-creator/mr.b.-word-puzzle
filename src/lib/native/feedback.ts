import { Capacitor } from '@capacitor/core';
import type { Settings } from '@/lib/ord/engine';
// Native vibration and web patterns adapted from Ludo/Yatzy; settings always respected.
export async function feedback(settings: Settings, success = false) {
  if (settings.haptics) {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
        if (success) await Haptics.notification({ type: NotificationType.Success });
        else await Haptics.impact({ style: ImpactStyle.Light });
      } catch { /* Gameplay never depends on feedback. */ }
    } else navigator.vibrate?.(success ? [10,40,20] : 5);
  }
  if (settings.sound) {
    try {
      const audio = new AudioContext();
      await audio.resume();
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = success ? 660 : 440;
      gain.gain.setValueAtTime(0.035, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + 0.18);
      oscillator.onended = () => { void audio.close(); };
    } catch { /* Silent fallback. */ }
  }
}