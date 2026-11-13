import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';
import { useTranslation } from '@/lib/i18n';
// Adapted from Sudoku's Radix dialog, with Ord's semantic classes and Swedish labels.
export function GameDialog({ open, onClose, title, description, children, className = '' }: { open: boolean; onClose: () => void; title: string; description: string; children: ReactNode; className?: string }) {
  const {t}=useTranslation();
  return <DialogPrimitive.Root open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="modal-overlay" />
    <DialogPrimitive.Content className={`modal ${className}`}>
      <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
      <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
      <DialogPrimitive.Close asChild><Button variant="ghost" className="tool-button modal-close" aria-label={t('close')}><X /></Button></DialogPrimitive.Close>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal></DialogPrimitive.Root>;
}