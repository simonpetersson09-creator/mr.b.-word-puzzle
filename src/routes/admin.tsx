import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState, useRef } from 'react';
import { ChartLine, Table2, RefreshCw, LogOut, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loadAdminStats } from '@/lib/admin.functions';
import { adminWinPercent, type AdminDay } from '@/lib/admin';

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [
    { title: 'Admin – Mr.B. Word Puzzle' },
    { name: 'description', content: 'Skyddad administration och daglig appstatistik för Mr.B. Word Puzzle.' },
    { property: 'og:title', content: 'Admin – Mr.B. Word Puzzle' },
    { property: 'og:description', content: 'Skyddad administration för Mr.B. Word Puzzle.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }),
  component: Admin,
});

function Admin() {
  const fetchStats = useServerFn(loadAdminStats);
  const [password, setPassword] = useState('');
  const credential = useRef('');
  const [days, setDays] = useState<AdminDay[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [diagram, setDiagram] = useState(false);
  const pending = useRef(false);
  async function load(key: string) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await fetchStats({ headers: { 'x-admin-key': key } });
      if (!result.days) {
        setError(result.error ?? 'Admin kunde inte öppnas.');
        if (result.error?.includes('godkändes')) { credential.current = ''; setDays(null); }
        return;
      }
      credential.current = key; setPassword(''); setDays(result.days);
    } catch { setError('Admin kunde inte öppnas just nu. Försök igen.'); }
    finally { pending.current = false; setBusy(false); }
  }
  if (!days) return <main className="min-h-dvh flex items-center justify-center bg-background text-foreground p-6">
    <form className="w-full max-w-sm space-y-5" onSubmit={event => { event.preventDefault(); void load(password); }}>
      <LockKeyhole className="size-8 text-primary" />
      <div><p className="text-sm text-primary mb-2">Mr.B. Word Puzzle</p><h1 className="font-display text-3xl">Admin</h1></div>
      <div className="space-y-2"><label htmlFor="admin-password" className="text-sm">Adminlösenord</label>
        <Input id="admin-password" name="admin-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></div>
      <Button className="w-full" type="submit" disabled={busy || !password}>{busy ? 'Öppnar admin…' : 'Logga in'}</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  </main>;
  const finished = days.reduce((sum, day) => sum + day.finished, 0);
  const wins = days.reduce((sum, day) => sum + day.wins, 0);
  const chronological = [...days].reverse();
  const maximum = Math.max(1, ...days.map(day => day.played));
  return <main className="h-dvh overflow-auto bg-background text-foreground p-4 md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-4 mb-7">
      <div><p className="text-primary text-sm mb-1">Mr.B. Word Puzzle</p><h1 className="font-display text-2xl">Admin · senaste 30 dagarna</h1></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setDiagram(!diagram)}>{diagram ? <Table2 /> : <ChartLine />}{diagram ? 'Tabell' : 'Diagram'}</Button>
        <Button variant="outline" disabled={busy} onClick={() => void load(credential.current)}><RefreshCw className={busy ? 'motion-safe:animate-spin' : ''} />Uppdatera</Button>
        <Button variant="outline" disabled={busy} onClick={() => { credential.current = ''; setDays(null); setPassword(''); setError(''); }}><LogOut />Logga ut</Button>
      </div>
    </header>
    <p className="text-sm text-muted-foreground mb-6">Endast iPhone och Android. Registrerade ordresultat, inte alla appöppningar. Dagens siffror är preliminära; spelarnas lokala speldatum används.</p>
    {error && <p role="alert" className="text-destructive mb-4">{error}</p>}
    <div className="grid grid-cols-2 gap-6 border-y border-border py-5 mb-8 max-w-xl">
      <div><p className="text-sm text-muted-foreground">Färdiga ord · 30 dagar</p><p className="text-3xl font-display text-primary mt-2">{finished.toLocaleString('sv-SE')}</p></div>
      <div><p className="text-sm text-muted-foreground">Vinstprocent</p><p className="text-3xl font-display text-primary mt-2">{adminWinPercent({ finished, wins }) ?? '—'}{finished ? ' %' : ''}</p></div>
    </div>
    {diagram ? <section aria-label="Spelande appenheter per dag" className="mb-8">
      <h2 className="font-display text-lg mb-5">Spelande appenheter per dag</h2>
      <svg viewBox="0 0 900 240" role="img" aria-label="Linjediagram för de senaste 30 dagarna" className="w-full max-w-5xl text-primary">
        <line x1="20" y1="210" x2="880" y2="210" stroke="currentColor" opacity="0.25" />
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={chronological.map((day, index) => `${20 + index * 860 / 29},${210 - day.played / maximum * 180}`).join(' ')} />
        {chronological.map((day, index) => <circle key={day.day} cx={20 + index * 860 / 29} cy={210 - day.played / maximum * 180} r="4" fill="currentColor"><title>{day.day}: {day.played} enheter</title></circle>)}
      </svg><div className="flex justify-between text-xs text-muted-foreground max-w-5xl"><span>{chronological[0]?.day}</span><span>{days[0]?.day}</span></div>
    </section> : null}
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right whitespace-nowrap">
        <thead className="text-muted-foreground border-b border-border"><tr>{['Datum', 'Enheter som spelade', 'iPhone', 'Android', 'Färdiga ord', 'Vinster', 'Vinst %', 'Snittpoäng'].map(label => <th key={label} className="p-3 font-medium first:text-left">{label}</th>)}</tr></thead>
        <tbody>{days.map(day => <tr key={day.day} className="border-b border-border hover:bg-secondary"><td className="p-3 text-left">{day.day}</td>{[day.played, day.ios, day.android, day.finished, day.wins, adminWinPercent(day) === null ? '—' : `${adminWinPercent(day)} %`, day.average === null ? '—' : day.average.toLocaleString('sv-SE', { maximumFractionDigits: 2 })].map((value, index) => <td className="p-3 tabular-nums" key={index}>{value}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </main>;
}