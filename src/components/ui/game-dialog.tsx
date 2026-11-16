import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';
import { useTranslation } from '@/lib/i18n';
// Adapted from Sudoku's Radix dialog, with Ord's semantic classes and Swedish labels.
export function GameDialog({ open, onClose, title, description, children, className = '', fullscreen = false }: { open: boolean; onClose: () => void; title: string; description: string; children: ReactNode; className?: string; fullscreen?: boolean }) {
  const {t}=useTranslation();
  return <DialogPrimitive.Root open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="modal-overlay" />
    <DialogPrimitive.Content className={`modal ${fullscreen ? 'fullscreen-panel' : ''} ${className}`}>
      {fullscreen ? <header className="fullscreen-panel-header"><DialogPrimitive.Close asChild><Button variant="ghost" className="tool-button" aria-label={t('resume')}><ArrowLeft /></Button></DialogPrimitive.Close><DialogPrimitive.Title>{title}</DialogPrimitive.Title></header> : <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>}
      <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
      {!fullscreen && <DialogPrimitive.Close asChild><Button variant="ghost" className="tool-button modal-close" aria-label={t('close')}><X /></Button></DialogPrimitive.Close>}
      {fullscreen ? <div className="fullscreen-panel-scroll"><div className="fullscreen-panel-body">{children}</div></div> : children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal></DialogPrimitive.Root>;
}