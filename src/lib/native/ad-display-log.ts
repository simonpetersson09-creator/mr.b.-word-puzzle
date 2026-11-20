import { Capacitor } from '@capacitor/core';
import { z } from 'zod';
import { rankingIdentity } from '../ranking/identity';
import { withDeadline } from './ad-presentation';

const KEY = 'mrb-word-puzzle:ad-displays-v1';
const eventSchema = z.object({
  roundId: z.string().regex(/^\d{4}-\d{2}-\d{2}(:[23])?$/),
  platform: z.enum(['ios', 'android']), isTest: z.boolean(),
  displayedAt: z.string().datetime(),
});
export type AdDisplay = z.infer<typeof eventSchema>;
interface LogStorage { read(): Promise<AdDisplay[]>; write(events: AdDisplay[]): Promise<void> }

// One serial queue owns recovery, persistence and acknowledgement. Never await
// network diagnostics from the fullscreen ad or gameplay transition.
export function createAdDisplayLog(storage: LogStorage, send: (event: AdDisplay) => Promise<void>, clock = Date.now) {
  const pending = new Map<string, AdDisplay>();
  const seen = new Set<string>();
  let restored = false, serial = Promise.resolve();
  const retain = () => {
    for (const [key, event] of pending) if (clock() - Date.parse(event.displayedAt) >= 30 * 86400000) pending.delete(key);
    return [...pending.values()].slice(-90);
  };
  const run = (work: () => Promise<void>) => {
    serial = serial.then(work).catch(() => { /* Retry on foreground/online; keep unacknowledged entries. */ });
    return serial;
  };
  const restore = async () => {
    if (restored) return;
    for (const raw of await storage.read()) {
      const event = eventSchema.parse(raw);
      if (!pending.has(event.roundId)) pending.set(event.roundId, event);
    }
    restored = true;
  };
  return {
    record(raw: AdDisplay) {
      const event = eventSchema.safeParse(raw);
      if (!event.success || seen.has(event.data.roundId)) return Promise.resolve();
      seen.add(event.data.roundId); pending.set(event.data.roundId, event.data);
      return run(async () => { await restore(); await storage.write(retain()); });
    },
    flush() {
      return run(async () => {
        await restore(); await storage.write(retain());
        for (const event of retain()) {
          await send(event);
          pending.delete(event.roundId);
          await storage.write(retain());
        }
      });
    },
  };
}

const decode = (raw: string | null) => raw ? z.array(eventSchema).max(90).parse(JSON.parse(raw)) : [];
const storage: LogStorage = {
  async read() {
    const { Preferences } = await import('@capacitor/preferences');
    // Failed native reads must not overwrite their recovery copy.
    const native = decode((await Preferences.get({ key: KEY })).value);
    let local: AdDisplay[] = [];
    try { local = decode(localStorage.getItem(KEY)); } catch { /* Native remains authoritative. */ }
    return [...new Map([...local, ...native].map(event => [event.roundId, event])).values()];
  },
  async write(events) {
    const value = JSON.stringify(events);
    try { localStorage.setItem(KEY, value); } catch { /* Preferences remains durable. */ }
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key: KEY, value });
  },
};
const log = createAdDisplayLog(storage, async event => {
  const identity = await rankingIdentity();
  const { supabase } = await import('@/integrations/supabase/client');
  const { data, error } = await withDeadline(Promise.resolve(supabase.rpc('word_record_ad_display', {
    p_device: identity.id, p_token: identity.token, p_round: event.roundId,
    p_platform: event.platform, p_test: event.isTest, p_displayed_at: event.displayedAt,
  })), 10000);
  if (error || data !== true) throw new Error('ad_display_not_acknowledged');
});
let listening = false;
export function startAdDisplayLog() {
  if (typeof window === 'undefined' || !['ios', 'android'].includes(Capacitor.getPlatform())) return;
  if (!listening) {
    listening = true;
    window.addEventListener('online', () => { void log.flush(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void log.flush(); });
  }
  void log.flush();
}
export function recordAdDisplay(roundId: string, isTest: boolean) {
  const platform = Capacitor.getPlatform();
  if (platform !== 'ios' && platform !== 'android') return;
  void log.record({ roundId, platform, isTest, displayedAt: new Date().toISOString() }).then(() => log.flush());
}