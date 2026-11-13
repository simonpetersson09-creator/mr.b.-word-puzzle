import { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { useTranslation } from '@/lib/i18n';

/** Sudoku-family confetti cannons, adapted to a word result without changing play. */
export function WordCelebration({ answer, onComplete }: { answer: string; onComplete: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(onComplete, reduced ? 900 : 2800);
    const cv = canvas.current, g = cv?.getContext('2d');
    if (!cv || !g || reduced) return () => clearTimeout(timer);
    const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W*dpr; cv.height = H*dpr; g.scale(dpr,dpr);
    const css = getComputedStyle(document.documentElement);
    const colors = ['--primary','--primary-light','--correct','--foreground'].map(key => css.getPropertyValue(key).trim());
    const parts = Array.from({length:160}, (_,i) => {
      const left = i%2===0, angle = (left ? -1.05 : -2.09)+(Math.random()-.5)*.8, speed = 9+Math.random()*10;
      return {x:left ? 0 : W,y:H*.75,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,rot:Math.random()*6,color:colors[i%colors.length] ?? colors[0],w:4+Math.random()*5};
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
    return () => {clearTimeout(timer);cancelAnimationFrame(raf);};
  }, [onComplete]);
  return <div className="word-celebration"><canvas ref={canvas} aria-hidden="true" /><div className="word-celebration-copy" role="status"><h2>{t('won')}</h2><strong>{answer}</strong></div><Button variant="ghost" className="celebration-continue" onClick={onComplete}>{t('result')}</Button></div>;
}