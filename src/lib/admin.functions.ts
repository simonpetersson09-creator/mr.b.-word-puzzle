import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server';
import { validAdminKey, type AdminDay } from './admin';

export const loadAdminStats = createServerFn({ method: 'POST' }).handler(async () => {
  setResponseHeader('Cache-Control', 'no-store');
  const expected = process.env['ADMIN_API_KEY'];
  if (!expected) return { days: null, error: 'Adminlösenord har inte konfigurerats.' };
  if (!await validAdminKey(getRequestHeader('x-admin-key') ?? '', expected)) {
    return { days: null, error: 'Adminlösenordet godkändes inte.' };
  }
  // Privileged reads only after server-side verification; credentials never returned.
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.rpc('word_admin_daily_stats');
  if (error || !Array.isArray(data)) return { days: null, error: 'Statistiken kunde inte hämtas. Försök igen.' };
  return { days: data as unknown as AdminDay[], error: null };
});