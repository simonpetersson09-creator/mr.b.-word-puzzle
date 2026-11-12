import * as Switch from '@radix-ui/react-switch';
import { Share2, Volume2, Vibrate, Check } from 'lucide-react';
import { useState } from 'react';
import mrB from '@/assets/mr-b.png';
import { Button } from './ui/button';
import { GameDialog } from './ui/game-dialog';
import { evaluate, hasWon, isFinished, statistics, type Round, type Save, type Settings } from '@/lib/ord/engine';
import { t } from '@/lib/i18n';
import { nativeAdsEnabled, needsAdPrivacyOptions, showAdPrivacyOptions } from '@/lib/native/interstitial';

export type Panel = 'rules' | 'stats' | 'settings' | null;
export function OrdDialogs({ panel, close, save, round, setSettings }: { panel: Panel; close: () => void; save: Save; round: Round; setSettings: (settings: Settings) => void }) {
  const [copied, setCopied] = useState(false);
  const stats = statistics(save.rounds, round.date);
  const done = isFinished(round);
  async function share() {
    const text = `Mr. B Ord · ${round.date}\n${hasWon(round) ? round.guesses.length : 'X'}/6\n\n` + round.guesses.map(g => evaluate(g, round.answer).map(m => ({ correct:'🟩', present:'🟨', absent:'⬜' })[m]).join('')).join('\n');
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); setCopied(true); }
    } catch { setCopied(false); }
  }
  return <>
    <GameDialog open={panel === 'rules'} onClose={close} title={t('rules')} description="Regler för dagens ordspel">
      <h2>{t('rules')}</h2><p className="modal-description">Ett ord. Fem bokstäver. Sex chanser.</p>
      <div className="rules-body"><p>Gissa dagens svenska ord på högst sex försök. Skriv ett ord med fem bokstäver och tryck på <strong>Gissa</strong>.</p>
        <div className="example">{'KANAL'.split('').map((c,i) => <span className={`tile ${evaluate('KANAL','KANEL')[i]}`} key={i}>{c}</span>)}</div>
        <div className="rule-label"><i className="correct" />Rätt bokstav, rätt plats</div><div className="rule-label"><i className="present" />Rätt bokstav, annan plats</div><div className="rule-label"><i className="absent" />Ingen återstående träff</div>
        <p>Om svaret är <strong>KANEL</strong> blir det andra A:et i KANAL grått. Varje bokstav i svaret kan bara ge en träff.</p>
        <p>Å, Ä och Ö är egna bokstäver. Endast ord med fem bokstäver i den svenska ordlistan godkänns. Ogiltiga ord kostar inga försök. Du kan spela en runda per dag. Ett nytt ord kommer klockan 03.00 i telefonens lokala tid.</p>
      </div><Button className="guess-button" onClick={close}>Då kör vi</Button>
    </GameDialog>
    <GameDialog open={panel === 'stats'} onClose={close} title={t('stats')} description="Avslutade rundor och fördelning av vinster">
      {done ? <div className="result-banner"><img src={mrB} alt="Mr. B" /><div><h2>{hasWon(round) ? t('won') : t('lost')}</h2><p>{hasWon(round) ? `Du hittade ${round.answer} på ${round.guesses.length} ${round.guesses.length === 1 ? 'försök' : 'försök'}.` : `Dagens ord var ${round.answer}.`}</p></div></div> : <><h2>{t('stats')}</h2><p className="modal-description">Varje dag är en ny chans.</p></>}
      <div className="stat-metrics"><div><strong>{stats.played}</strong><span>Spelade</span></div><div><strong>{stats.percentage}%</strong><span>Vinster</span></div><div><strong>{stats.current}</strong><span>Segersvit</span></div><div><strong>{stats.longest}</strong><span>Längsta svit</span></div></div>
      <div className="distribution"><h3>Vinster per försök</h3>{stats.distribution.map((count, i) => <div className="distribution-row" key={i}><span>{i+1}</span><div className="bar-track"><div className={`bar ${count ? 'nonzero' : ''}`} style={{width: `${Math.max(9, count / Math.max(1,...stats.distribution) * 100)}%`}}>{count}</div></div></div>)}</div>
      {done && <><Button className="guess-button" onClick={() => { void share(); }}>{copied ? <Check /> : <Share2 />}{copied ? t('copied') : t('share')}</Button><p className="next-puzzle">Nästa ord klockan 03.00 · lokal tid</p></>}
    </GameDialog>
    <GameDialog open={panel === 'settings'} onClose={close} title={t('settings')} description="Ljud och vibrationer för spelet">
      <h2>{t('settings')}</h2><p className="modal-description">Precis som du vill spela.</p>
      {(['sound','haptics'] as const).map(key => <div className="setting-row" key={key}><span className="setting-label">{key === 'sound' ? <Volume2 /> : <Vibrate />}{t(key)}</span><Switch.Root className="switch" checked={save.settings[key]} onCheckedChange={checked => setSettings({...save.settings,[key]:checked})} aria-label={t(key)}><Switch.Thumb className="switch-thumb" /></Switch.Root></div>)}
      <div className="setting-detail"><span>Spelspråk</span><span>Svenska</span></div><div className="setting-detail"><span>Dagens ord byts</span><span>03.00 · lokal tid</span></div>
      {needsAdPrivacyOptions() && <Button variant="secondary" onClick={() => { void showAdPrivacyOptions(); }}>Annonsintegritet</Button>}
      <p className="license-note">Mr. B Ord · version 1.0<br />Svensk ordlista © Göran Andersson, LGPL-3.0. Ordlistorna finns separat i projektet. {nativeAdsEnabled() ? 'Mellanannonser kan visas efter avslutat spel.' : 'Inga annonser eller spårning är aktiverade.'}</p>
    </GameDialog>
  </>;
}