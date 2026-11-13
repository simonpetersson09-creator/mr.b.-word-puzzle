import * as Switch from '@radix-ui/react-switch';
import { Share2, Volume2, Vibrate, Check, ArrowRight, Globe2, ShieldCheck, ChevronRight, Flame, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import mrB from '@/assets/mr-b.png';
import { Button } from './ui/button';
import { GameDialog } from './ui/game-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { evaluate, hasWon, isFinished, statistics, welcomeState, roundKey, DAILY_WORDS, type Round, type Save, type Settings } from '@/lib/ord/engine';
import { WordLicenses } from './word-licenses';
import { useTranslation } from '@/lib/i18n';
import { languages, languageFlags, type Language } from '@/lib/i18n/languages';
import { wordPacks } from '@/lib/ord/words/localized';
import { dailyAds, getAdConsentChoices, initializeAds, nativeAdsEnabled, needsAdPrivacyOptions, showAdPrivacyOptions } from '@/lib/native/interstitial';
import { readAdConsentChoices } from '@/lib/native/ad-consent';

export type Panel = 'rules' | 'stats' | 'settings' | null;
export function OrdDialogs({ panel, close, save, round, setSettings, welcome, dismissWelcome, phoneLanguage, nextWord, dailyDone }: { panel: Panel; close: () => void | Promise<void>; save: Save; round: Round; setSettings: (settings: Settings) => void; welcome:boolean; dismissWelcome:()=>void; phoneLanguage:Language; nextWord:()=>void; dailyDone:boolean }) {
  const {t}=useTranslation();
  const [copied, setCopied] = useState(false);
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
  const today = Array.from({length: DAILY_WORDS}, (_, i) => save.rounds[roundKey(round.date, i)]);
  const goal = [3,7,14,30,50,100,200,365].find(m => m > stats.current) ?? stats.current + 100;
  const prevGoal = [0,3,7,14,30,50,100,200,365].filter(m => m <= stats.current).pop() ?? 0;
  const goalPct = Math.round((stats.current - prevGoal) / Math.max(1, goal - prevGoal) * 100);
  const done = isFinished(round), started=Object.values(save.rounds).some(r=>r.date===round.date && r.guesses.length>0);
  const openingState = welcomeState(save,round);
  const welcomeCopy = openingState === 'complete' ? 'welcomeDone' : openingState === 'next' ? 'welcomeNext' : openingState === 'resume' ? 'welcomeResume' : 'welcomeNew';
  function languagePicker(kind:'language'|'gameLanguage') {
    return <Select value={save.settings[kind] ?? 'auto'} disabled={kind==='gameLanguage' && started} onValueChange={value=>{if (value==='auto' || value in languages) setSettings({...save.settings,[kind]:value});}}><SelectTrigger className="language-select" aria-label={t(kind)}><SelectValue /></SelectTrigger><SelectContent className="language-options"><SelectItem value="auto">{languageFlags[phoneLanguage]} {t('automatic')} · {languages[phoneLanguage]}</SelectItem>{Object.entries(languages).map(([code,label])=><SelectItem key={code} value={code} disabled={kind==='gameLanguage' && code!=='sv' && !wordPacks[code as Language]}>{languageFlags[code as Language]} {label}</SelectItem>)}</SelectContent></Select>;
  }
  async function share() {
    const text = `Mr.B. Word Puzzle · ${round.date} · ${(round.slot ?? 0)+1}/3\n${hasWon(round) ? round.guesses.length : 'X'}/6\n\n` + round.guesses.map(g => evaluate(g, round.answer).map(m => ({ correct:'🟩', present:'🟨', absent:'⬜' })[m]).join('')).join('\n');
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); setCopied(true); }
    } catch { setCopied(false); }
  }
  return <>
    <GameDialog open={welcome} onClose={dismissWelcome} title={started ? t('welcomeBack') : t('welcome')} description={t('dailyMoment')}>
      <div className="welcome-body"><h2>{started ? t('welcomeBack') : t('welcome')}</h2><p className="welcome-tagline">{t('dailyMoment')}</p><div className="welcome-example" aria-hidden="true">{['M','R','.','B','!'].map((letter,i)=><span className={`tile ${i===0 || i===4 ? 'correct' : i===3 ? 'present' : ''}`} key={i}>{letter}</span>)}</div><p className="modal-description">{t(welcomeCopy)}</p><div className="welcome-language"><Globe2 /><span>{t('gameLanguage')}</span>{languagePicker('gameLanguage')}</div><Button className="welcome-play" onClick={dismissWelcome}><ArrowRight />{t(done ? 'result' : started ? 'resume' : 'start')}</Button><p className="next-puzzle">{t('next')}</p></div>
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
    <GameDialog open={panel === 'stats'} onClose={close} title={t('stats')} description={t('statsIntro')}>
      {done ? <div className="result-banner"><img src={mrB} alt="Mr. B" /><div><h2>{hasWon(round) ? t('won') : t('lost')}</h2><p>{hasWon(round) ? t('found',{word:round.answer,count:round.guesses.length}) : t('answer',{word:round.answer})}</p></div></div> : <><h2>{t('stats')}</h2><p className="modal-description">{t('statsIntro')}</p></>}
      <div className="streak-hero"><div className={`streak-flame ${stats.current ? 'lit' : ''}`}><Flame /></div><div className="streak-text"><strong>{stats.current}</strong><span>{t('streakDays')}</span></div><div className="streak-best"><Trophy /><span>{stats.longest}</span></div></div>
      <div className="streak-goal"><div className="streak-goal-label"><span>{stats.current ? t('nextGoal',{count: goal - stats.current, goal}) : t('startStreak')}</span><b>{goal}</b></div><div className="streak-goal-track"><div style={{width: `${Math.max(4, goalPct)}%`}} /></div></div>
      <div className="today-words"><span>{t('todayWords')}</span><div>{today.map((r,i)=><i key={i} className={!r || !isFinished(r) ? '' : hasWon(r) ? 'won' : 'lost'}>{r && isFinished(r) ? (hasWon(r) ? r.guesses.length : '×') : ''}</i>)}</div></div>
      <div className="stat-metrics">{([['played',stats.played],['wins',stats.percentage+'%']] as const).map(([key,value])=><div key={key}><strong>{value}</strong><span>{t(key)}</span></div>)}</div>
      <div className="distribution"><h3>{t('distribution')}</h3>{stats.distribution.map((count, i) => <div className="distribution-row" key={i}><span>{i+1}</span><div className="bar-track"><div className={`bar ${count ? 'nonzero' : ''}`} style={{width: `${Math.max(9, count / Math.max(1,...stats.distribution) * 100)}%`}}>{count}</div></div></div>)}</div>
      {done && <>{!dailyDone && <Button className="welcome-play" onClick={()=>{void Promise.resolve(close()).then(nextWord);}}><ArrowRight />{t('nextWord')}</Button>}<Button className="guess-button" onClick={() => { void share(); }}>{copied ? <Check /> : <Share2 />}{copied ? t('copied') : t('share')}</Button><p className="next-puzzle">{t('next')}</p></>}
    </GameDialog>
    <GameDialog open={panel === 'settings' && !licensesOpen} onClose={close} title={t('settings')} description={t('settingsIntro')}>
      <h2>{t('settings')}</h2><p className="modal-description">{t('settingsIntro')}</p>
      {(['sound','haptics'] as const).map(key => <div className="setting-row" key={key}><span className="setting-label">{key === 'sound' ? <Volume2 /> : <Vibrate />}{t(key)}</span><Switch.Root className="switch" checked={save.settings[key]} onCheckedChange={checked => setSettings({...save.settings,[key]:checked})} aria-label={t(key)}><Switch.Thumb className="switch-thumb" /></Switch.Root></div>)}
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
