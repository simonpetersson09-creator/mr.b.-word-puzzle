import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';
import { useTranslation } from '@/lib/i18n';
// Adapted from Sudoku's Radix dialog, with Ord's semantic classes and Swedish labels.
export function GameDialog({ open, onClose, title, description, children, className = '', fullscreen = false, headerAction }: { open: boolean; onClose: () => void; title: string; description: string; children: ReactNode; className?: string; fullscreen?: boolean; headerAction?: ReactNode }) {
  const {t}=useTranslation();
  // Swipe left-to-right goes back, like the iOS back gesture; ignores vertical scrolls and text fields.
  const swipe=useRef<{x:number;y:number;at:number}|null>(null);
  const onTouchStart=(e:TouchEvent)=>{const target=e.target as HTMLElement;const touch=e.touches[0];swipe.current=e.touches.length===1&&touch&&!target.closest('input,textarea,select,[role="listbox"],[data-no-swipe]')?{x:touch.clientX,y:touch.clientY,at:Date.now()}:null;};
  const onTouchEnd=(e:TouchEvent)=>{const start=swipe.current;swipe.current=null;const touch=e.changedTouches[0];if(!start||!touch)return;const dx=touch.clientX-start.x,dy=Math.abs(touch.clientY-start.y);if(dx>70&&dy<dx*0.5&&Date.now()-start.at<800)onClose();};
  return <DialogPrimitive.Root open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="modal-overlay" />
    <DialogPrimitive.Content onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={()=>{swipe.current=null;}} className={`modal ${fullscreen ? 'fullscreen-panel' : ''} ${className}`}>
      {fullscreen ? <header className="fullscreen-panel-header"><DialogPrimitive.Close asChild><Button variant="ghost" className="tool-button" aria-label={t('resume')}><ArrowLeft /></Button></DialogPrimitive.Close><DialogPrimitive.Title className="flex-1">{title}</DialogPrimitive.Title>{headerAction}</header> : <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>}
      <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
      {!fullscreen && <DialogPrimitive.Close asChild><Button variant="ghost" className="tool-button modal-close" aria-label={t('close')}><X /></Button></DialogPrimitive.Close>}
      {fullscreen ? <div className="fullscreen-panel-scroll"><div className="fullscreen-panel-body">{children}</div></div> : children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal></DialogPrimitive.Root>;
}