# Swedish word lists

## Expanded validation and international candidate packs

`inflections.json` adds 2,569 Swedish five-letter entries from wordfreq candidates that pass the original Swedish Hunspell dictionary with its affix rules (spylls lookup). Original entries and frozen daily answers are unchanged. This includes real inflections such as BILAR and HUSET, not arbitrary generated suffixes.

`packs.json` contains separate frequency-ranked five-grapheme candidate guess lists and frozen 240-entry answer pools for 31 other locales, generated from wordfreq 3.1.1. Norwegian uses nb; Croatian uses sh; both Portuguese locales currently share the pt corpus. Sources, attribution and conditions are in WORDFREQ-NOTICE.md, WORDFREQ-LICENSE.txt and CC-BY-SA-4.0.txt. Derived lists are CC BY-SA 4.0. Frequency alone does not prove dictionary validity: international pools require native-speaker/editorial review before release, including names, loanwords, profanity and script-specific grapheme conventions. Thai, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi and Telugu currently have no adequate wordfreq corpus and are disabled for word selection. UI language selection retains all 40 Yatzy locales; untranslated new copy currently falls back to English.

`guesses.json` contains 4,443 unique five-letter lowercase Swedish base entries (normalized to NFC uppercase) extracted from https://github.com/wooorm/dictionaries/blob/main/dictionaries/sv/index.dic on 2026-11-12. Only A–Z and ÅÄÖ entries are included; Hunspell inflection flags and proper-name entries are excluded. This is a base-word list, not every possible inflection.

Source: Göran Andersson's Swedish spell-checking dictionary, copyright © 2003–2019 Göran Andersson. License: LGPL-3.0, see COPYRIGHT, LGPL-3.0.txt and GPL-3.0.txt. Both lists remain separately editable and distributable under LGPL-3.0. The original dictionary source is available at the URL above. The filtering method is `^[a-zåäö]{5}$` on the text before the first `/`, uppercase, unique, sorted.

`answers.ts` is a manually selected subset of familiar words from that dictionary, under the same license. Its immutable v1 order repeats every 72 days starting 2026-11-12 (Europe/Stockholm). Future word-list expansions must start a new dated schedule and retain v1 for its historical dates. A saved round stores its assigned answer.