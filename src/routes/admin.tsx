import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChartLine, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loadAdminStats } from '@/lib/admin.functions';
import { adminWinPercent, adminVisibleDays, adminRollingAverage, type AdminDay } from '@/lib/admin';

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [
    { title: 'Admin – Mr.B. Word Puzzle' },
    { name: 'description', content: 'Skyddad administration och daglig appstatistik för Mr.B. Word Puzzle.' },
    { property: 'og:title', content: 'Admin – Mr.B. Word Puzzle' },
    { property: 'og:description', content: 'Skyddad administration för Mr.B. Word Puzzle.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'referrer', content: 'no-referrer' },
  ] }),
  component: Admin,
});

function Admin() {
  const fetchStats = useServerFn(loadAdminStats);
  const [password, setPassword] = useState('');
  const credential = useRef<{ key: string } | { hubToken: string }>({ key: '' });
  const [initializing, setInitializing] = useState(true);
  const initialized = useRef(false);
  const [days, setDays] = useState<AdminDay[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [diagram, setDiagram] = useState(false);
  const pending = useRef(false);
  const load = useCallback(async (auth: { key: string } | { hubToken: string }) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const headers = 'hubToken' in auth ? { 'x-admin-hub-token': auth.hubToken } : { 'x-admin-key': auth.key };
      const result = await fetchStats({ headers });
      if (!result.days) {
        setError(result.error ?? 'Admin kunde inte öppnas.');
        if (result.error?.includes('godkändes')) { credential.current = { key: '' }; setDays(null); }
        return;
      }
      credential.current = auth; setPassword(''); setDays(adminVisibleDays(result.days));
    } catch { setError('Admin kunde inte öppnas just nu. Försök igen.'); }
    finally { pending.current = false; setBusy(false); }
  }, [fetchStats]);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const url = new URL(window.location.href);
    const hubToken = url.searchParams.get('hub_token');
    if (hubToken !== null) {
      // Remove the bearer credential from the address/history; never persist it or use cookies.
      url.searchParams.delete('hub_token');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      credential.current = { hubToken };
      void load({ hubToken }).finally(() => setInitializing(false));
    } else setInitializing(false);
  }, [load]);
  if (initializing) return <main className="yatzy-admin min-h-screen flex items-center justify-center bg-background text-foreground p-6"><p role="status">Laddar…</p></main>;
  if (!days) return <main className="yatzy-admin min-h-screen flex items-center justify-center bg-background text-foreground p-6">
    <form className="w-full max-w-sm space-y-3" onSubmit={event => { event.preventDefault(); void load({ key: password }); }}>
      <h1 className="text-xl font-semibold">Admin</h1>
      <Input id="admin-password" name="admin-password" aria-label="Adminnyckel" placeholder="Adminnyckel" className="h-auto bg-card px-3 py-2 text-sm shadow-none" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
      <Button className="w-full h-10 shadow-none" type="submit" disabled={busy || !password}>{busy ? 'Laddar…' : 'Logga in'}</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  </main>;
  const finished = days.reduce((sum, day) => sum + day.finished, 0);
  const wins = days.reduce((sum, day) => sum + day.wins, 0);
  const chronological = [...days].reverse();
  const maximum = Math.max(1, ...days.map(day => day.played));
  const mean = (day: string, key: 'played' | 'ios' | 'android' | 'finished' | 'wins') => adminRollingAverage(days, day, key)?.toLocaleString('sv-SE', { maximumFractionDigits: 1 }) ?? '—';
  const fmtDay = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', timeZone: 'Europe/Stockholm' });
  const columns = ['Enheter som spelade', 'iPhone / Android', 'Färdiga ord totalt', 'Vinster', 'Vinst %', 'Snittpoäng', 'Annonser', 'Annons iPhone / Android', 'Testannonser'];
  return <main className="yatzy-admin min-h-screen max-h-screen overflow-y-auto overscroll-contain bg-background text-foreground p-4 md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div><h1 className="text-xl font-semibold">{diagram ? 'Linjediagram – 19 november och hit' : '19 november och hit, per dag'}</h1>
        <p className="text-sm text-muted-foreground">Bara appen (iPhone/Android). Dagens rad är inte komplett. Parentes: dagsmedel för upp till 30 dagar från 19 november.</p></div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="h-9 text-sm shadow-none" variant="outline" onClick={() => setDiagram(!diagram)}>{diagram ? <ArrowLeft /> : <ChartLine />}{diagram ? 'Till tabellen' : 'Diagram'}</Button>
        <Button size="sm" className="h-9 text-sm shadow-none" variant="outline" disabled={busy} onClick={() => void load(credential.current)}><RefreshCw className={busy ? 'motion-safe:animate-spin' : ''} />{busy ? 'Uppdaterar…' : 'Uppdatera'}</Button>
        <Button size="sm" className="h-9 text-sm shadow-none" variant="outline" disabled={busy} onClick={() => { credential.current = { key: '' }; setDays(null); setPassword(''); setError(''); }}><LogOut />Logga ut</Button>
      </div>
    </header>
    {error && <p role="alert" className="text-destructive mb-4">{error}</p>}
    {diagram ? <section aria-label="Spelande appenheter per dag" className="mb-8">
      <h2 className="font-display text-lg mb-5">Spelande appenheter per dag</h2>
      <svg viewBox="0 0 900 240" role="img" aria-label="Linjediagram för de senaste 30 dagarna" className="w-full max-w-5xl text-primary">
        <line x1="20" y1="210" x2="880" y2="210" stroke="currentColor" opacity="0.25" />
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={chronological.map((day, index) => `${20 + index * 860 / Math.max(1, chronological.length - 1)},${210 - day.played / maximum * 180}`).join(' ')} />
        {chronological.map((day, index) => <circle key={day.day} cx={20 + index * 860 / Math.max(1, chronological.length - 1)} cy={210 - day.played / maximum * 180} r="4" fill="currentColor"><title>{day.day}: {day.played} enheter</title></circle>)}
      </svg><div className="flex justify-between text-xs text-muted-foreground max-w-5xl"><span>{chronological[0]?.day}</span><span>{days[0]?.day}</span></div>
    </section> : null}
    {!diagram && <div className="relative overflow-x-auto rounded-lg border border-border">
      <table className="relative w-full text-sm">
        <thead className="bg-card"><tr><th className="text-left px-2 py-1.5 font-medium align-bottom">Datum</th>{columns.map(label => <th key={label} className="px-2 py-1.5 font-medium align-bottom leading-tight max-w-[7.5rem] text-right">{label}</th>)}</tr></thead>
        <tbody>{days.map(day => <tr key={day.day} className="border-t border-border"><td className="px-2 py-1 whitespace-nowrap">{fmtDay(day.day)}</td>
          {(['played', 'ios', 'finished', 'wins'] as const).map(key => <td key={key} className="px-2 py-1 whitespace-nowrap text-right tabular-nums">{day[key]} <span className="text-muted-foreground">({mean(day.day, key)})</span>{key === 'ios' && <> / {day.android} <span className="text-muted-foreground">({mean(day.day, 'android')})</span></>}</td>)}
          <td className="px-2 py-1 text-right whitespace-nowrap">{adminWinPercent(day) === null ? '—' : `${adminWinPercent(day)} %`}</td><td className="px-2 py-1 text-right">{day.average?.toLocaleString('sv-SE', { maximumFractionDigits: 2 }) ?? '—'}</td>
          <td className="px-2 py-1 text-right tabular-nums">{day.adShown ?? 0}</td><td className="px-2 py-1 text-right whitespace-nowrap tabular-nums">{day.adIos ?? 0} / {day.adAndroid ?? 0}</td><td className="px-2 py-1 text-right tabular-nums">{day.adTest ?? 0}</td>
        </tr>)}</tbody>
        <tfoot className="bg-card font-medium"><tr className="border-t border-border">{['Summa', '—', '—', finished, wins, adminWinPercent({ finished, wins }) === null ? '—' : `${adminWinPercent({ finished, wins })} %`, '—', days.reduce((sum, day) => sum + (day.adShown ?? 0), 0), `${days.reduce((sum, day) => sum + (day.adIos ?? 0), 0)} / ${days.reduce((sum, day) => sum + (day.adAndroid ?? 0), 0)}`, days.reduce((sum, day) => sum + (day.adTest ?? 0), 0)].map((value, index) => <td key={index} className="px-2 py-1.5 whitespace-nowrap text-right first:text-left">{value}</td>)}</tr></tfoot>
      </table>
    </div>}
    <p className="text-xs text-muted-foreground mt-3">Registrerade ordresultat, inte alla appöppningar. Spelarnas lokala speldatum används. Enhetssummor visas inte eftersom samma enhet spelar flera dagar.</p>
    <p className="text-xs text-muted-foreground mt-2">Annonser: bekräftat visade mellanannonser, inte bara försök. Testannonser räknas separat. Visningsdatum följer svensk tid. Loggningen kräver den nya appversionen; äldre visningar saknar underlag. AdMob ansvarar för intäktsstatistiken.</p>
  </main>;
}