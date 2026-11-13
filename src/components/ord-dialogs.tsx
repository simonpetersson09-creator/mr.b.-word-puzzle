import * as Switch from '@radix-ui/react-switch';
import { Vibrate, Check, ArrowRight, Globe2, ShieldCheck, ChevronRight, Flame, Trophy, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import mrB from '@/assets/mr-b.png';
import { Button } from './ui/button';
import { GameDialog } from './ui/game-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { evaluate, hasWon, isFinished, statistics, welcomeState, roundKey, DAILY_WORDS, type Round, type Save, type Settings } from '@/lib/ord/engine';
import { WordLicenses } from './word-licenses';
import { fetchCountryRank, type CountryRank } from '@/lib/ranking/ranking';
import { flagFor } from '@/lib/ranking/country';
import { useTranslation } from '@/lib/i18n';
import { languages, languageFlags, type Language } from '@/lib/i18n/languages';
import { wordPacks } from '@/lib/ord/words/localized';
import { dailyAds, getAdConsentChoices, initializeAds, nativeAdsEnabled, needsAdPrivacyOptions, showAdPrivacyOptions } from '@/lib/native/interstitial';
import { readAdConsentChoices } from '@/lib/native/ad-consent';
import { feedback } from '@/lib/native/feedback';

export type Panel = 'rules' | 'stats' | 'settings' | null;
export function OrdDialogs({ panel, close, save, round, setSettings, welcome, dismissWelcome, phoneLanguage, nextWord, dailyDone }: { panel: Panel; close: () => void | Promise<void>; save: Save; round: Round; setSettings: (settings: Settings) => void; welcome:boolean; dismissWelcome:()=>void; phoneLanguage:Language; nextWord:()=>void; dailyDone:boolean }) {
  const {t}=useTranslation();
  const [licensesOpen, setLicensesOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [choices, setChoices] = useState(() => readAdConsentChoices(undefined, undefined));
  useEffect(() => {
    if (panel !== 'settings') return;
    let alive = true;
    void initializeAds().then(async () => {
      const saved = await getAdConsentChoices();
      if (alive) { setPrivacyRequired(needsAdPrivacyOptions()); setChoices(saved); }
    });
    return () => { alive = false; };
  }, [panel, privacyOpen]);
  async function changePrivacy() {
    if (privacyBusy) return;
    setPrivacyBusy(true); setPrivacyError(false);
    try {
      const success = await showAdPrivacyOptions();
      setPrivacyError(!success); setChoices(await getAdConsentChoices()); setPrivacyRequired(needsAdPrivacyOptions());
      if (success && !isFinished(round)) dailyAds.preload(round.slot ? `${round.date}:${round.slot+1}` : round.date, round.guesses.length);
    } catch { setPrivacyError(true); } finally { setPrivacyBusy(false); }
  }
  const stats = statistics(save.rounds, round.date);
  const winsTotal = stats.distribution.reduce((a, b) => a + b, 0);
  const [rank, setRank] = useState<CountryRank | null>(null);
  useEffect(() => { if (panel !== 'stats') return; let live = true; fetchCountryRank(winsTotal, stats.played).then(r => { if (live) setRank(r); }); return () => { live = false; }; }, [panel, winsTotal, stats.played]);
  const today = Array.from({length: DAILY_WORDS}, (_, i) => save.rounds[roundKey(round.date, i)]);
  const goal = [3,7,14,30,50,100,200,365].find(m => m > stats.current) ?? stats.current + 100;
  const prevGoal = [0,3,7,14,30,50,100,200,365].filter(m => m <= stats.current).pop() ?? 0;
  const goalPct = Math.round((stats.current - prevGoal) / Math.max(1, goal - prevGoal) * 100);
  const done = isFinished(round), started=Object.values(save.rounds).some(r=>r.date===round.date && r.guesses.length>0);
  const openingState = welcomeState(save,round);
  const welcomeCopy = openingState === 'complete' ? 'welcomeWarmDone' : openingState === 'next' || (openingState === 'new' && started) ? 'welcomeWarmNext' : openingState === 'resume' ? 'welcomeWarmResume' : 'welcomeFresh';
  function languagePicker(kind:'language'|'gameLanguage') {
    return <Select value={save.settings[kind] ?? 'auto'} disabled={kind==='gameLanguage' && started} onValueChange={value=>{if (value==='auto' || value in languages) setSettings({...save.settings,[kind]:value});}}><SelectTrigger className="language-select" aria-label={t(kind)}><SelectValue /></SelectTrigger><SelectContent className="language-options"><SelectItem value="auto">{languageFlags[phoneLanguage]} {t('automatic')} · {languages[phoneLanguage]}</SelectItem>{Object.entries(languages).map(([code,label])=><SelectItem key={code} value={code} disabled={kind==='gameLanguage' && code!=='sv' && !wordPacks[code as Language]}>{languageFlags[code as Language]} {label}</SelectItem>)}</SelectContent></Select>;
  }
  return <>
    <GameDialog open={welcome} onClose={dismissWelcome} title={started ? t('welcomeBack') : t('welcomeReady')} description={t(welcomeCopy)}>
      <div className="welcome-body welcome-refreshed">
        <span className="welcome-brand">Mr.B. Word Puzzle</span>
        <div className="welcome-symbol" aria-hidden="true"><Sparkles /></div>
        <h2>{started ? t('welcomeBack') : t('welcomeReady')}</h2>
        <p className="welcome-intro">{t(welcomeCopy)}</p>
        <div className="welcome-progress" aria-label={t('todayWords')}>
          {today.map((r,i)=><div key={i} className={`welcome-word ${r && isFinished(r) ? hasWon(r) ? 'won' : 'lost' : i===(round.slot ?? 0) ? 'current' : ''}`}><span>{r && isFinished(r) ? hasWon(r) ? <Check /> : '×' : <span className="welcome-mystery">?</span>}</span><small>{t('word')} {i+1}</small></div>)}
        </div>
        {started && <p className="welcome-saved"><ShieldCheck />{t('welcomeSaved')}</p>}
        <div className="welcome-language"><Globe2 /><span>{t('gameLanguage')}</span>{languagePicker('gameLanguage')}</div>
        <Button className="welcome-play" onClick={dismissWelcome}>{t(done ? 'result' : started ? 'resume' : 'welcomeBegin')}<ArrowRight /></Button>
        <p className="next-puzzle">{t('next')}</p>
      </div>
    </GameDialog>
    <GameDialog open={panel === 'rules'} onClose={close} title={t('rules')} description={t('rulesIntro')}>
      <h2>{t('rules')}</h2><p className="modal-description">{t('rulesIntro')}</p>
       <div className="rules-body">
         <p>{t('rulesBody')}</p>
         <figure className="rules-example">
           <figcaption>{t('rulesExampleAnswer',{word:'KANEL'})}</figcaption>
           <div className="example" aria-label="KALAS">{'KALAS'.split('').map((c,i) => <span className={`tile ${evaluate('KALAS','KANEL')[i]}`} key={i}>{c}</span>)}</div>
         </figure>
         {([['correct','rulesGreen'],['present','rulesYellow'],['absent','rulesGrey']] as const).map(([mark,label])=><div className="rule-label" key={mark}><i className={mark} aria-hidden="true" /><span>{t(label)}</span></div>)}
         <section className="rules-notes"><h3>{t('rulesGoodToKnow')}</h3><ul><li>{t('rulesValid')}</li><li>{t('rulesDuplicates')}</li><li>{t('rulesDaily')}</li></ul></section>
         <Button className="guess-button rules-continue" onClick={close}><ArrowRight />{t('resume')}</Button>
       </div>
    </GameDialog>
    <GameDialog open={panel === 'stats'} onClose={close} title={t('stats')} description={t('stats')}>
      {done ? <div className="result-banner"><img src={mrB} alt="Mr. B" /><div><h2>{hasWon(round) ? t('won') : t('lost')}</h2><p>{hasWon(round) ? t('found',{word:round.answer,count:round.guesses.length}) : t('answer',{word:round.answer})}</p></div></div> : <h2>{t('stats')}</h2>}
      <div className="streak-hero"><div className={`streak-flame ${stats.current ? 'lit' : ''}`}><Flame /></div><div className="streak-text"><strong>{stats.current}</strong><span>{t('streakDays')}</span></div><div className="streak-best"><Trophy /><span>{stats.longest}</span></div></div>
      <div className="streak-goal"><div className="streak-goal-label"><span>{stats.current ? t('nextGoal',{count: goal - stats.current, goal}) : t('startStreak')}</span><b>{goal}</b></div><div className="streak-goal-track"><div style={{width: `${Math.max(4, goalPct)}%`}} /></div></div>
      <div className="today-words"><span>{t('todayWords')}</span><div>{today.map((r,i)=><i key={i} className={!r || !isFinished(r) ? '' : hasWon(r) ? 'won' : 'lost'}>{r && isFinished(r) ? (hasWon(r) ? r.guesses.length : '×') : ''}</i>)}</div></div>
      {rank && <div className="country-rank"><span className="country-flag" aria-hidden="true">{flagFor(rank.country)}</span><div><strong>{t('betterThan',{pct: rank.betterThan})}</strong><span>{t('inCountry',{country: new Intl.DisplayNames([document.documentElement.lang || 'en'],{type:'region'}).of(rank.country) ?? rank.country})}</span></div></div>}
      <div className="stat-metrics">{([['played',stats.played],['wins',stats.percentage+'%']] as const).map(([key,value])=><div key={key}><strong>{value}</strong><span>{t(key)}</span></div>)}</div>
      <div className="distribution"><h3>{t('distribution')}</h3>{stats.distribution.map((count, i) => <div className="distribution-row" key={i}><span>{i+1}</span><div className="bar-track"><div className={`bar ${count ? 'nonzero' : ''}`} style={{width: `${Math.max(9, count / Math.max(1,...stats.distribution) * 100)}%`}}>{count}</div></div></div>)}</div>
      {done && <>{!dailyDone && <Button className="welcome-play" onClick={()=>{void Promise.resolve(close()).then(nextWord);}}><ArrowRight />{t('nextWord')}</Button>}<p className="next-puzzle">{t('next')}</p></>}
    </GameDialog>
    <GameDialog open={panel === 'settings' && !licensesOpen} onClose={close} title={t('settings')} description={t('settingsIntro')}>
      <h2>{t('settings')}</h2><p className="modal-description">{t('settingsIntro')}</p>
      <div className="setting-row"><span className="setting-label"><Vibrate />{t('haptics')}</span><Switch.Root className="switch" checked={save.settings.haptics} onCheckedChange={checked => {const settings={...save.settings,haptics:checked};setSettings(settings);if(checked) void feedback(settings);}} aria-label={t('haptics')}><Switch.Thumb className="switch-thumb" /></Switch.Root></div>
      <div className="setting-row language-row"><span className="setting-label"><Globe2 />{t('language')}</span>{languagePicker('language')}</div><div className="setting-row language-row"><span>{t('gameLanguage')}</span>{languagePicker('gameLanguage')}</div>{started && <p className="license-note">{t('lockedLanguage')}</p>}
      <div className="setting-detail"><span>{t('changes')}</span><span>{t('localTime')}</span></div>
      <Button variant="secondary" className="privacy-toggle" aria-expanded={privacyOpen} aria-controls="saved-ad-choices" onClick={() => setPrivacyOpen(open => !open)}><ShieldCheck /><span className="flex-1">{t('adPrivacy')}</span><ChevronRight className={privacyOpen ? 'rotate-90' : ''} /></Button>
      {privacyOpen && <div className="privacy-content" id="saved-ad-choices">
        {!nativeAdsEnabled() ? <p>{t('adsOff')}</p> : <>
          {Object.values(choices).some(value => value !== 'unknown') ? <><strong>{t('adPrivacySaved')}</strong><p>{t('adPrivacySource')}</p><dl>{([['storage','adPrivacyStorage'],['adProfile','adPrivacyProfile'],['useAdProfile','adPrivacyUseProfile']] as const).filter(([key]) => choices[key] !== 'unknown').map(([key,label]) => <div key={key}><dt>{t(label)}</dt><dd>{t(choices[key] === 'allowed' ? 'adPrivacyAllowed' : 'adPrivacyDenied')}</dd></div>)}</dl></> : <p>{t('adPrivacyUnknown')}</p>}
          {privacyRequired && <Button variant="secondary" className="privacy-toggle" disabled={privacyBusy} aria-busy={privacyBusy} onClick={() => { void changePrivacy(); }}><ShieldCheck />{t('adPrivacyChange')}</Button>}
          {privacyError && <p className="privacy-error" role="alert">{t('adPrivacyFailed')}</p>}
        </>}
      </div>}
      <p className="license-note">Mr.B. Word Puzzle · 1.0<br />{nativeAdsEnabled() ? t('adsOn') : t('adsOff')}</p>
      <Button variant="link" className="license-link" onClick={() => setLicensesOpen(true)}>{t('dictionary')}</Button>
    </GameDialog>
    <GameDialog open={panel === 'settings' && licensesOpen} onClose={() => setLicensesOpen(false)} title={t('dictionary')} description={t('dictionary')}><h2>{t('dictionary')}</h2><WordLicenses /></GameDialog>
  </>;
}
