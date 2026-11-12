# Swedish word lists

`guesses.json` contains 4,443 unique five-letter lowercase Swedish base entries (normalized to NFC uppercase) extracted from https://github.com/wooorm/dictionaries/blob/main/dictionaries/sv/index.dic on 2026-11-12. Only A–Z and ÅÄÖ entries are included; Hunspell inflection flags and proper-name entries are excluded. This is a base-word list, not every possible inflection.

Source: Göran Andersson's Swedish spell-checking dictionary, copyright © 2003–2019 Göran Andersson. License: LGPL-3.0, see COPYRIGHT, LGPL-3.0.txt and GPL-3.0.txt. Both lists remain separately editable and distributable under LGPL-3.0. The original dictionary source is available at the URL above. The filtering method is `^[a-zåäö]{5}$` on the text before the first `/`, uppercase, unique, sorted.

`answers.ts` is a manually selected subset of familiar words from that dictionary, under the same license. Its immutable v1 order repeats every 72 days starting 2026-11-12 (Europe/Stockholm). Future word-list expansions must start a new dated schedule and retain v1 for its historical dates. A saved round stores its assigned answer.