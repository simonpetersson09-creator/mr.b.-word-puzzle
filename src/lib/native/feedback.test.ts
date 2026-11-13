import { afterEach, describe, expect, it, vi } from 'vitest';
import { feedback } from './feedback';
const native = vi.hoisted(() => ({enabled:true, impact:vi.fn(), notification:vi.fn()}));
vi.mock('@capacitor/core', () => ({Capacitor:{isNativePlatform:()=>native.enabled}}));
vi.mock('@capacitor/haptics', () => ({Haptics:{impact:native.impact,notification:native.notification},ImpactStyle:{Light:'LIGHT'},NotificationType:{Success:'SUCCESS'}}));
afterEach(() => {vi.resetAllMocks();vi.unstubAllGlobals();native.enabled=true;});
describe('haptic-only feedback', () => {
  it('uses a light native impact for a guess', async () => {
    await feedback({sound:true,haptics:true});
    expect(native.impact).toHaveBeenCalledWith({style:'LIGHT'});
    expect(native.notification).not.toHaveBeenCalled();
  });
  it('uses the native success vibration for a win', async () => {
    await feedback({sound:false,haptics:true},true);
    expect(native.notification).toHaveBeenCalledWith({type:'SUCCESS'});
  });
  it('respects the disabled vibration setting', async () => {
    await feedback({sound:true,haptics:false},true);
    expect(native.notification).not.toHaveBeenCalled();
    expect(native.impact).not.toHaveBeenCalled();
  });
  it('never creates audio even with a legacy enabled sound setting', async () => {
    const audio=vi.fn();vi.stubGlobal('AudioContext',audio);
    await feedback({sound:true,haptics:true});
    expect(audio).not.toHaveBeenCalled();
  });
  it('does not interrupt play if native vibration fails', async () => {
    native.impact.mockRejectedValueOnce(new Error('unavailable'));
    await expect(feedback({sound:false,haptics:true})).resolves.toBeUndefined();
  });
});