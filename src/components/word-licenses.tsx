import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import copyright from '@/lib/ord/words/COPYRIGHT?raw';
import lgpl from '@/lib/ord/words/LGPL-3.0.txt?raw';
import gpl from '@/lib/ord/words/GPL-3.0.txt?raw';
import cc from '@/lib/ord/words/CC-BY-SA-4.0.txt?raw';
import apache from '@/lib/ord/words/WORDFREQ-LICENSE.txt?raw';
import notice from '@/lib/ord/words/WORDFREQ-NOTICE.md?raw';
import sources from '@/lib/ord/words/README.md?raw';
import guesses from '@/lib/ord/words/guesses.json';
import inflections from '@/lib/ord/words/inflections.json';
import packs from '@/lib/ord/words/packs.json';
import { answers } from '@/lib/ord/words/answers';
import { useTranslation } from '@/lib/i18n';

const documents: Record<string, string> = { 'Sources & attribution': sources + '\n\n' + copyright, 'LGPL-3.0': lgpl, 'GPL-3.0': gpl, 'CC BY-SA 4.0': cc, 'Apache 2.0': apache, 'wordfreq attribution': notice };
export function WordLicenses() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('Sources & attribution');
  function download() {
    const blob = new Blob([JSON.stringify({ documents, guesses, inflections, answers, packs })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'mr-b-word-puzzle-wordlists-licenses.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="mt-5 space-y-4">
    <Select value={selected} onValueChange={setSelected}><SelectTrigger aria-label={t('dictionary')}><SelectValue /></SelectTrigger><SelectContent>{Object.keys(documents).map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>
    <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{documents[selected]}</pre>
    <Button variant="secondary" onClick={download} aria-label={t('dictionary')} title={t('dictionary')}><Download /></Button>
  </section>;
}