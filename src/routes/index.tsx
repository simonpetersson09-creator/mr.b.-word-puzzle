import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartNoAxesColumnIncreasing, CircleHelp, Settings2, Delete, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrdDialogs, type Panel } from '@/components/ord-dialogs';
import { WordCelebration } from '@/components/word-celebration';
import { GuessTile } from '@/components/guess-tile';
import { useGuessReveal } from '@/hooks/use-guess-reveal';
import { emptySave, evaluate, hasWon, isFinished, keyboardMarks, newRound, gameDate, submitGuess, activeSlot, roundKey, DAILY_WORDS, type Save } from '@/lib/ord/engine';
import { initializeSave, loadSave, mergeRound, persistSave, flushNativeSave, retrySave, onSaveError, SAVE_KEY } from '@/lib/ord/storage';
import { installViewportSync } from '@/lib/native/viewport';
import { feedback } from '@/lib/native/feedback';
import { deviceLanguage, setAppLanguage, useTranslation } from '@/lib/i18n';
import { type Language } from '@/lib/i18n/languages';
import { keyboardRows, letters, uppercase, wordPacks } from '@/lib/ord/words/localized';
import { installOpeningListener } from '@/lib/native/opening';
import { dailyAds, initializeAds, isAdFlowBusy } from '@/lib/native/interstitial';

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    {title:'Mr.B. Word Puzzle – dagens svenska ordspel'},
    {name:'description',content:'Dagens svenska ord med Mr. B. Fem bokstäver, sex försök per ord och tre nya ord varje dag.'},
    {property:'og:title',content:'Mr.B. Word Puzzle – tre nya ord varje dag'},
    {property:'og:description',content:'Tre ord varje dag, med sex försök per ord. Spela direkt, utan konto.'},
    {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'},
  ]}),
  component: Index,
});

function Index() {
  const {t,language}=useTranslation();
  const [phoneLanguage,setPhoneLanguage]=useState<Language>('sv');
  const [welcome,setWelcome]=useState(true);
  const [save,setSave] = useState<Save>(emptySave);
  const [date,setDate] = useState('2026-11-12');
  const dateRef = useRef(date);
  useEffect(() => { dateRef.current = date; }, [date]);
  const [slot,setSlot]=useState(0);
  const [ready,setReady] = useState(false);
  const [input,setInput] = useState('');
  const composing = useRef(false);
  const [message,setMessage] = useState('');
  const [panel,setPanel] = useState<Panel>(null);
  const reveal = useGuessReveal();
  const pressTimers = useRef(new Map<string,ReturnType<typeof setTimeout>>());
  const resultExit = useRef<Promise<void> | null>(null);
  const [pressedKeys,setPressedKeys] = useState<Record<string,number>>({});
  const [celebrating,setCelebrating] = useState(false);
  const finishCelebration = useCallback(() => {setCelebrating(false);setPanel('stats');},[]);
  function flashKey(letter: string) {
    const prior=pressTimers.current.get(letter); if (prior) clearTimeout(prior);
    setPressedKeys(keys=>({...keys,[letter]:(keys[letter] ?? 0)+1}));
    pressTimers.current.set(letter,setTimeout(()=>{setPressedKeys(keys=>{const next={...keys};delete next[letter];return next;});pressTimers.current.delete(letter);},220));
  }
  const saveRef = useRef(save);
  const saveNeedsRetry = useRef(false);
  const recovering = useRef(false);
  const recoveryAt = useRef(0);
  const desiredLanguage=save.settings.gameLanguage && save.settings.gameLanguage !== 'auto' ? save.settings.gameLanguage : phoneLanguage;
  const key=roundKey(date,slot);
  const todayRounds=useMemo(()=>Object.values(save.rounds).filter(r=>r.date===date),[save.rounds,date]);
  const dailyLanguage=todayRounds[0]?.language ?? (todayRounds.length ? 'sv' : desiredLanguage);
  const round = useMemo(()=>save.rounds[key] ?? newRound(date,dailyLanguage,slot,todayRounds.map(r=>r.answer)),[save.rounds,key,date,dailyLanguage,slot,todayRounds]);
  const dailyDone=todayRounds.filter(isFinished).length===DAILY_WORDS;
  function nextWord() { setSlot(activeSlot(saveRef.current,date));setInput('');setMessage('');setPanel(null); }
  const wordLanguage=round.language ?? 'sv';
  const available=wordLanguage === 'sv' || !!wordPacks[wordLanguage];
  const rows=useMemo(()=>keyboardRows(wordLanguage),[wordLanguage]);
  const keyColumns=rows ? Math.max(...rows.map(row=>row.length)) : 0;
  const eraseColumns=rows ? keyColumns-(rows[rows.length-1]?.length ?? 0) : 0;
  function openWelcome() {
    if (isAdFlowBusy() || resultExit.current) return;
    reveal.cancel();
    const current = gameDate();
    setCelebrating(false);
    if (dateRef.current !== current) { setInput(''); setPressedKeys({}); }
    dateRef.current = current;
    setDate(current); setSlot(activeSlot(saveRef.current,current)); setPanel(null); setMessage(''); setWelcome(true);
    void deviceLanguage().then(lang=>{setPhoneLanguage(lang); const choice=saveRef.current.settings.language; setAppLanguage(choice && choice!=='auto' ? choice : lang);});
    void initializeAds().then(()=>{const active=saveRef.current.rounds[roundKey(current,activeSlot(saveRef.current,current))];if(active && !isFinished(active))dailyAds.preload(roundKey(active.date,active.slot),active.guesses.length);});
  }
  const done = isFinished(round);
  const marks = useMemo(()=>keyboardMarks(reveal.row === null ? round : {...round,guesses:round.guesses.slice(0,reveal.row)}),[round,reveal.row]);
  function commit(next: Save) {
    saveRef.current = next; setSave(next);
    if (!persistSave(next)) { saveNeedsRetry.current=true; setMessage(t('storage')); }
  }
  useEffect(() => {
    let mounted = true;
    const unsubscribeErrors = onSaveError(() => { saveNeedsRetry.current=true; if (mounted) setMessage(t('storage')); });
    void Promise.all([initializeSave(),deviceLanguage()]).then(([loaded,lang]) => {
      if (!mounted) return;
      saveRef.current = loaded; setSave(loaded); setPhoneLanguage(lang); setAppLanguage(loaded.settings.language && loaded.settings.language!=='auto' ? loaded.settings.language : lang); setDate(gameDate()); setSlot(activeSlot(loaded,gameDate())); setReady(true);
      void initializeAds().then(() => {
        const active = loaded.rounds[roundKey(gameDate(),activeSlot(loaded,gameDate()))];
        if (active && !isFinished(active)) dailyAds.preload(roundKey(active.date,active.slot), active.guesses.length);
      });
    });
    function recover() {
      if (!saveNeedsRetry.current || recovering.current || Date.now()<recoveryAt.current) return;
      recovering.current=true; recoveryAt.current=Date.now()+15000;
      void retrySave(saveRef.current).then(loaded => {
        if (!mounted) return;
        let merged=loaded;
        for (const r of Object.values(saveRef.current.rounds)) merged=mergeRound(merged,r);
        merged={...merged,settings:saveRef.current.settings};
        saveRef.current=merged; setSave(merged);
        saveNeedsRetry.current=!persistSave(merged);
        if (!saveNeedsRetry.current) setMessage('');
      }).catch(() => { if(mounted) setMessage(t('storage')); }).finally(() => {recovering.current=false;});
    }
    const cleanup = installViewportSync();
    const cleanupOpening=installOpeningListener(openWelcome);
    const languageChanged=()=>openWelcome();
    window.addEventListener('languagechange',languageChanged);
    function refreshDay() {
      if (!document.hidden) recover();
      const current = gameDate();
      if (dateRef.current !== current) { dateRef.current=current; reveal.cancel(); setCelebrating(false); setDate(current); setSlot(activeSlot(saveRef.current,current)); setInput(''); setMessage(''); setPanel(null); }
    }
    function reload(event: StorageEvent) { if (event.key === SAVE_KEY) { reveal.cancel(); let updated=loadSave(); for (const round of Object.values(saveRef.current.rounds)) updated=mergeRound(updated,round); saveRef.current=updated; setSave(updated); setSlot(activeSlot(updated,gameDate())); setInput(''); } }
    const timer=setInterval(refreshDay,1000);
    window.addEventListener('online',recover); window.addEventListener('focus',refreshDay); document.addEventListener('visibilitychange',refreshDay); window.addEventListener('storage',reload);
    return () => { mounted = false; unsubscribeErrors(); cleanup(); cleanupOpening(); window.removeEventListener('languagechange',languageChanged); clearInterval(timer); pressTimers.current.forEach(clearTimeout); window.removeEventListener('online',recover); window.removeEventListener('focus',refreshDay); document.removeEventListener('visibilitychange',refreshDay); window.removeEventListener('storage',reload); };
  },[]);
  function enter() {
    if (!ready || done || welcome || panel || celebrating || reveal.busy.current || !available || composing.current) return;
    const currentDate=gameDate();
    if (currentDate !== date) { setDate(currentDate); setSlot(activeSlot(saveRef.current,currentDate)); setInput(''); setMessage(t('newWord')); return; }
    const latest=loadSave(), active=latest.rounds[key] ?? saveRef.current.rounds[key] ?? round;
    const result=submitGuess(active,input);
    if(result.error) { setMessage(t(result.error)); return; }
    reveal.start(result.round.guesses.length-1, () => {
      void feedback(saveRef.current.settings,hasWon(result.round));
      if (isFinished(result.round)) { if (hasWon(result.round)) setCelebrating(true); else setPanel('stats'); }
    });
    setMessage(''); setInput(''); commit(mergeRound({...latest,rounds:{...saveRef.current.rounds,...latest.rounds},settings:saveRef.current.settings},result.round));
    void initializeAds().then(() => dailyAds.preload(key,result.round.guesses.length));
  }
  function type(letter: string) { if(!ready || done || welcome || panel || celebrating || reveal.busy.current || !available || marks[letter]==='absent') return; flashKey(letter); setMessage(''); setInput(prior => letters(prior).length < 5 ? prior+letter : prior); }
  function erase() { if(!ready || done || welcome || panel || celebrating || reveal.busy.current) return; flashKey('erase'); setMessage(''); setInput(prior => letters(prior).slice(0,-1).join('')); }
  function closePanel() {
    if (resultExit.current) return resultExit.current;
    const showAd = panel === 'stats' && done;
    if (!showAd) { setPanel(null); return Promise.resolve(); }
    // Do not unlock the next word until the native ad has been dismissed.
    const exit = flushNativeSave().catch(() => {saveNeedsRetry.current=true;setMessage(t('storage'));}).then(() => dailyAds.afterResult(key,true))
      .finally(() => { setPanel(null); resultExit.current=null; });
    resultExit.current=exit;
    return exit;
  }
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if(panel || welcome || celebrating || !rows || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if(event.key === 'Enter') { event.preventDefault(); enter(); }
      else if(event.key === 'Backspace') { event.preventDefault(); erase(); }
      else if(/^[\p{L}\p{M}]$/u.test(event.key)) { event.preventDefault(); type(uppercase(event.key,wordLanguage)); }
    }
    window.addEventListener('keydown',keydown); return () => window.removeEventListener('keydown',keydown);
  });
  const formatted = new Intl.DateTimeFormat(language === 'no' ? 'nb' : language,{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  return (
    <div className={`app-screen ${rows && rows.length > 4 ? 'many-key-rows' : ''}`}>
      <header className="app-header"><nav className="header-tools header-tools-left" aria-label={t('rules')}>
        <Button className="tool-button" variant="ghost" disabled={reveal.row!==null} aria-label={t('rules')} title={t('rules')} onClick={() => setPanel('rules')}><CircleHelp /></Button>
      </nav><div className="brand"><div className="brand-label"><h1>Mr.B. Word Puzzle</h1><small>{`${t('word')} ${slot+1}/${DAILY_WORDS} · ${formatted}`}</small></div></div><nav className="header-tools header-tools-right" aria-label={t('settings')}>
        <Button className="tool-button" variant="ghost" disabled={reveal.row!==null} aria-label={t('stats')} title={t('stats')} onClick={() => setPanel('stats')}><ChartNoAxesColumnIncreasing /></Button>
        <Button className="tool-button" variant="ghost" disabled={reveal.row!==null} aria-label={t('settings')} title={t('settings')} onClick={() => setPanel('settings')}><Settings2 /></Button>
      </nav></header>
      <main className="game">
        <div className="board-zone"><div className="board" role="grid" aria-label={t('board')}>{Array.from({length:6},(_,row) => {
          const guess=round.guesses[row], active=reveal.row === null && !done && row===round.guesses.length;
          const chars=letters(guess ?? (active ? input : '')); const colors=guess ? evaluate(guess,round.answer) : [];
          return Array.from({length:5},(_,col) => <GuessTile key={`${row}-${col}`} letter={chars[col]} mark={colors[col]} active={active} revealing={reveal.row===row} column={col} label={t('cell',{row:row+1,col:col+1,letter:chars[col] ?? t('empty')})+(reveal.row===null && colors[col] ? ', '+t(colors[col]) : '')} />);
        })}</div></div>
        <div className={`game-message ${message ? 'error' : ''}`} aria-live="polite">{message || (done && reveal.row===null ? (hasWon(round) ? t('found',{word:round.answer,count:round.guesses.length}) : t('answer',{word:round.answer})) : '')}<span className="sr-only">{!done && !message && reveal.row===null ? t('attempt',{count:round.guesses.length+1}) : ''}</span></div>
        {!available ? <p className="game-message">{t('unavailable')}</p> : rows ? <div className={`keyboard ${eraseColumns <= 3 ? 'narrow-actions' : ''}`} aria-label={t('keyboard')} style={{'--key-columns':keyColumns,'--erase-columns':eraseColumns} as React.CSSProperties}>{rows.map((row,i) => <div className="key-row" key={i} style={{'--row-columns':row.length} as React.CSSProperties}>{row.map(c => <Button key={c} variant="secondary" className={`key ${marks[c] ?? ''} ${pressedKeys[c] ? 'key-pressed' : ''}`} disabled={!ready || done || welcome || reveal.row!==null || marks[c]==='absent'} onPointerDown={event=>{if(event.button===0 && marks[c]!=='absent') {event.preventDefault();type(c);}}} onClick={event => {if(event.detail===0) type(c);}} aria-label={t('letter',{letter:c})}><span className="key-letter">{c}</span>{pressedKeys[c] && <span className="key-pulse" key={pressedKeys[c]} aria-hidden="true" />}</Button>)}{i===rows.length-1 && <Button variant="secondary" className={`key erase-key ${pressedKeys['erase'] ? 'key-pressed' : ''}`} disabled={done || !ready || welcome || reveal.row!==null} onPointerDown={event=>{if(event.button===0) {event.preventDefault();erase();}}} onClick={event=>{if(event.detail===0) erase();}} aria-label={t('erase')} title={t('erase')}><Delete />{pressedKeys['erase'] && <span className="key-pulse" key={pressedKeys['erase']} aria-hidden="true" />}</Button>}</div>)}<Button className="guess-button" disabled={!ready || !available || welcome || reveal.row!==null} onClick={done ? () => setPanel('stats') : enter}>{done ? <ChartNoAxesColumnIncreasing /> : <ArrowRight />}{done ? t('result') : t('guess')}</Button></div> : <input className="word-input" value={input} disabled={!ready || done || welcome || reveal.row!==null} aria-label={t('typeWord')} autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={event=>{composing.current=false;setInput(letters(uppercase(event.currentTarget.value,wordLanguage)).slice(0,5).join(''));}} onChange={event=>{const value=event.target.value;setInput(composing.current ? value : letters(uppercase(value,wordLanguage)).slice(0,5).join(''));}} onKeyDown={event=>{if (event.key==='Enter' && !event.nativeEvent.isComposing) enter();}} />}
        {!rows && <Button className="guess-button" disabled={!ready || !available || welcome || reveal.row!==null} onClick={done ? () => setPanel('stats') : enter}>{done ? <ChartNoAxesColumnIncreasing /> : <ArrowRight />}{done ? t('result') : t('guess')}</Button>}
      </main>
      {celebrating && <WordCelebration answer={round.answer} onComplete={finishCelebration} />}
      <OrdDialogs welcome={ready && welcome && !panel} dismissWelcome={()=>{setWelcome(false); if(done) setPanel('stats');}} nextWord={nextWord} dailyDone={dailyDone} phoneLanguage={phoneLanguage} panel={panel} close={closePanel} save={save} round={round} setSettings={settings => {commit({...saveRef.current,settings});setAppLanguage(settings.language && settings.language!=='auto' ? settings.language : phoneLanguage);setInput('');}} />
    </div>
  );
}
