import * as Switch from '@radix-ui/react-switch';
import { Share2, Volume2, Vibrate, Check, ArrowRight, Globe2, BookOpen } from 'lucide-react';
import { useState } from 'react';
import mrB from '@/assets/mr-b.png';
import { Button } from './ui/button';
import { GameDialog } from './ui/game-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { evaluate, hasWon, isFinished, statistics, welcomeState, type Round, type Save, type Settings } from '@/lib/ord/engine';
import { WordLicenses } from './word-licenses';
import { useTranslation } from '@/lib/i18n';
import { languages, type Language } from '@/lib/i18n/languages';
import { wordPacks } from '@/lib/ord/words/localized';
import { nativeAdsEnabled, needsAdPrivacyOptions, showAdPrivacyOptions } from '@/lib/native/interstitial';

export type Panel = 'rules' | 'stats' | 'settings' | 'licenses' | null;
export function OrdDialogs({ panel, close, save, round, setSettings, welcome, dismissWelcome, phoneLanguage, nextWord, dailyDone }: { panel: Panel; close: () => void | Promise<void>; save: Save; round: Round; setSettings: (settings: Settings) => void; welcome:boolean; dismissWelcome:()=>void; phoneLanguage:Language; nextWord:()=>void; dailyDone:boolean }) {
  const {t}=useTranslation();
  const [copied, setCopied] = useState(false);
  const [licensesOpen, setLicensesOpen] = useState(false);
  const stats = statistics(save.rounds, round.date);
  const done = isFinished(round), started=Object.values(save.rounds).some(r=>r.date===round.date && r.guesses.length>0);
  const openingState = welcomeState(save,round);
  const welcomeCopy = openingState === 'complete' ? 'welcomeDone' : openingState === 'next' ? 'welcomeNext' : openingState === 'resume' ? 'welcomeResume' : 'welcomeNew';
  function languagePicker(kind:'language'|'gameLanguage') {
    return <Select value={save.settings[kind] ?? 'auto'} disabled={kind==='gameLanguage' && started} onValueChange={value=>{if (value==='auto' || value in languages) setSettings({...save.settings,[kind]:value});}}><SelectTrigger className="language-select" aria-label={t(kind)}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">{t('automatic')} · {languages[phoneLanguage]}</SelectItem>{Object.entries(languages).map(([code,label])=><SelectItem key={code} value={code} disabled={kind==='gameLanguage' && code!=='sv' && !wordPacks[code as Language]}>{label}</SelectItem>)}</SelectContent></Select>;
  }
  async function share() {
    const text = `Mr. B Ord · ${round.date} · ${(round.slot ?? 0)+1}/3\n${hasWon(round) ? round.guesses.length : 'X'}/6\n\n` + round.guesses.map(g => evaluate(g, round.answer).map(m => ({ correct:'🟩', present:'🟨', absent:'⬜' })[m]).join('')).join('\n');
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); setCopied(true); }
    } catch { setCopied(false); }
  }
  return <>
    <GameDialog open={welcome} onClose={dismissWelcome} title={started ? t('welcomeBack') : t('welcome')} description={t('dailyMoment')}>
      <div className="welcome-body"><img className="welcome-mrb" src={mrB} alt="Mr. B" /><span className="welcome-brand">MR. B ORD</span><h2>{started ? t('welcomeBack') : t('welcome')}</h2><p className="welcome-tagline">{t('dailyMoment')}</p><div className="welcome-example" aria-hidden="true">{['M','R','.','B','!'].map((letter,i)=><span className={`tile ${i===0 || i===4 ? 'correct' : i===3 ? 'present' : ''}`} key={i}>{letter}</span>)}</div><p className="modal-description">{t(welcomeCopy)}</p><div className="welcome-language"><Globe2 /><span>{t('gameLanguage')}</span>{languagePicker('gameLanguage')}</div><Button className="welcome-play" onClick={dismissWelcome}><ArrowRight />{t(done ? 'result' : started ? 'resume' : 'start')}</Button><p className="next-puzzle">{t('next')}</p></div>
    </GameDialog>
    <GameDialog open={panel === 'rules'} onClose={close} title={t('rules')} description={t('rulesIntro')}>
      <h2>{t('rules')}</h2><p className="modal-description">{t('rulesIntro')}</p>
      <div className="rules-body"><p>{t('rulesBody')}</p><div className="example">{'KANAL'.split('').map((c,i) => <span className={`tile ${evaluate('KANAL','KANEL')[i]}`} key={i}>{c}</span>)}</div>{(['correct','present','absent'] as const).map(mark=><div className="rule-label" key={mark}><i className={mark} />{t(mark)}</div>)}<p>{t('rulesDetail')}</p></div><Button className="guess-button" onClick={close}><ArrowRight />{t('resume')}</Button>
    </GameDialog>
    <GameDialog open={panel === 'stats'} onClose={close} title={t('stats')} description={t('statsIntro')}>
      {done ? <div className="result-banner"><img src={mrB} alt="Mr. B" /><div><h2>{hasWon(round) ? t('won') : t('lost')}</h2><p>{hasWon(round) ? t('found',{word:round.answer,count:round.guesses.length}) : t('answer',{word:round.answer})}</p></div></div> : <><h2>{t('stats')}</h2><p className="modal-description">{t('statsIntro')}</p></>}
      <div className="stat-metrics">{([['played',stats.played],['wins',stats.percentage+'%'],['streak',stats.current],['longest',stats.longest]] as const).map(([key,value])=><div key={key}><strong>{value}</strong><span>{t(key)}</span></div>)}</div>
      <div className="distribution"><h3>{t('distribution')}</h3>{stats.distribution.map((count, i) => <div className="distribution-row" key={i}><span>{i+1}</span><div className="bar-track"><div className={`bar ${count ? 'nonzero' : ''}`} style={{width: `${Math.max(9, count / Math.max(1,...stats.distribution) * 100)}%`}}>{count}</div></div></div>)}</div>
      {done && <>{!dailyDone && <Button className="welcome-play" onClick={()=>{void Promise.resolve(close()).then(nextWord);}}><ArrowRight />{t('nextWord')}</Button>}<Button className="guess-button" onClick={() => { void share(); }}>{copied ? <Check /> : <Share2 />}{copied ? t('copied') : t('share')}</Button><p className="next-puzzle">{t('next')}</p></>}
    </GameDialog>
    <GameDialog open={panel === 'settings' && !licensesOpen} onClose={close} title={t('settings')} description={t('settingsIntro')}>
      <h2>{t('settings')}</h2><p className="modal-description">{t('settingsIntro')}</p>
      {(['sound','haptics'] as const).map(key => <div className="setting-row" key={key}><span className="setting-label">{key === 'sound' ? <Volume2 /> : <Vibrate />}{t(key)}</span><Switch.Root className="switch" checked={save.settings[key]} onCheckedChange={checked => setSettings({...save.settings,[key]:checked})} aria-label={t(key)}><Switch.Thumb className="switch-thumb" /></Switch.Root></div>)}
      <div className="setting-row language-row"><span className="setting-label"><Globe2 />{t('language')}</span>{languagePicker('language')}</div><div className="setting-row language-row"><span>{t('gameLanguage')}</span>{languagePicker('gameLanguage')}</div>{started && <p className="license-note">{t('lockedLanguage')}</p>}
      <div className="setting-detail"><span>{t('changes')}</span><span>{t('localTime')}</span></div>
      {needsAdPrivacyOptions() && <Button variant="secondary" onClick={() => { void showAdPrivacyOptions(); }}>{t('adPrivacy')}</Button>}
      <Button variant="secondary" onClick={() => setLicensesOpen(true)}><BookOpen />{t('dictionary')}</Button>
      <p className="license-note">Mr. B Ord · 1.0<br />{nativeAdsEnabled() ? t('adsOn') : t('adsOff')}</p>
    </GameDialog>
    <GameDialog open={panel === 'settings' && licensesOpen} onClose={() => setLicensesOpen(false)} title={t('dictionary')} description={t('dictionary')}><h2>{t('dictionary')}</h2><WordLicenses /></GameDialog>
  </>;
}
