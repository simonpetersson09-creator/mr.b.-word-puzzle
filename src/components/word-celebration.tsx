import { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/** Sudoku-family confetti cannons, adapted to a word result without changing play. */
export function WordCelebration({ answer, dailyDone, onNext, onResult }: { answer: string; dailyDone: boolean; onNext: () => void; onResult: () => void }) {
  const busy = useRef(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cv = canvas.current, g = cv?.getContext('2d');
    if (!cv || !g || reduced) return;
    const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W*dpr; cv.height = H*dpr; g.scale(dpr,dpr);
    const css = getComputedStyle(document.documentElement);
    const colors = ['--primary','--primary-light','--correct','--foreground'].map(key => css.getPropertyValue(key).trim());
    const parts = Array.from({length:160}, (_,i) => {
      const left = i%2===0, angle = (left ? -1.05 : -2.09)+(Math.random()-.5)*.8, speed = 9+Math.random()*10;
      return {x:left ? 0 : W,y:H*.75,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,rot:Math.random()*6,color:colors[i%colors.length] ?? css.getPropertyValue('--primary').trim(),w:4+Math.random()*5};
    });
    let raf = 0, last = performance.now();
    const loop = (now:number) => {
      const dt = Math.min(2,(now-last)/16.67); last=now; g.clearRect(0,0,W,H);
      for (const part of parts) {
        part.vy+=.26*dt; part.x+=part.vx*dt; part.y+=part.vy*dt; part.rot+=.08*dt;
        g.save(); g.translate(part.x,part.y); g.rotate(part.rot); g.fillStyle=part.color; g.fillRect(-part.w/2,-5,part.w,10); g.restore();
      }
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    const stop = setTimeout(() => {cancelAnimationFrame(raf); g.clearRect(0,0,W,H);}, 4000);
    return () => {clearTimeout(stop);cancelAnimationFrame(raf);};
  }, []);
  return <div className="word-celebration"><canvas ref={canvas} aria-hidden="true" /><div className="word-celebration-copy" role="status"><h2>{t('won')}</h2><strong>{answer}</strong></div><div className="celebration-actions">{dailyDone
    ? <Button className="welcome-play" onClick={onResult}>{t('result')}</Button>
    : <><Button className="welcome-play" onClick={()=>{if(busy.current)return;busy.current=true;onNext();}}><ArrowRight />{t('nextWord')}</Button><Button variant="ghost" className="celebration-continue" onClick={onResult}>{t('result')}</Button></>}</div></div>;
}