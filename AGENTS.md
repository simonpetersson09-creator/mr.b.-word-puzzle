<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project architecture
- Keep daily-game logic and licensed dictionaries separate from presentation; pure tests protect scoring and calendar rules.
- Store all daily rounds in one device-local versioned snapshot with a recovery copy and a serialized native Preferences mirror; derive statistics from completed rounds to keep results idempotent across restarts and WebView eviction.
- Retain immutable dated answer schedules and saved answers; app updates must not change already assigned puzzles.
- Keep the normal TanStack Start bootstrap and package native apps through a separate client-only root; local assets and word lists allow offline mobile play.
- Show interstitials only at result exit with Word Puzzle's own hard-coded AdMob IDs (Google test unit in development); gameplay must never depend on ads.
- Compute game-day keys from the device timezone's wall-clock parts; this preserves the daily boundary across daylight-saving transitions.
- Use a frozen seeded answer shuffle from the new schedule epoch while retaining existing saved answers; offline restarts must not reroll puzzles.
- Isolate interstitial policy behind an injectable adapter keyed by dated round slot; consent precedes per-round preload (including resumed words), and result exit awaits ready-ad dismissal before unlocking the next word to avoid cross-round inventory races; unavailable ads never block play.
- Keep the app's own iOS project and privacy manifest separate from reference apps; production identifiers and signing must never be copied.
- Use Yatzy's language registry, native device-language detection and bundled translations; fallback copy is English until each locale is fully reviewed.
- Store the chosen word language on each dated round and lock it after the first valid guess; switching languages must never grant another daily game or lose statistics.
- Key daily words by date and bounded slot, retaining the original date-only key for the first word; unlock subsequent slots only after completion and keep streaks based on winning days rather than word count.
- Segment words into Unicode grapheme clusters; use the native text keyboard for scripts that cannot fit a fixed alphabet keyboard.
- Bundle frequency-derived candidate dictionaries separately under their data license; languages without adequate offline word data remain unavailable rather than silently using another language's words.
- Show a state-aware welcome dialog on cold launch and native foreground entry; visibility changes cover the browser preview without replaying on focus alone.
- Preserve Greek tonos during input casing rather than altering frozen dictionaries or saved answers; accented scheduled words must remain winnable.
- Read and write recovery copies independently and notify subscribed UI on persistence errors; a broken primary must not prevent backup recovery or hide a native write failure.
- Bundle attribution, license texts and redistributable word data into the shared client UI; legal notices must remain readable offline in the native shell.
- Read saved ad choices from native UMP purpose bits using the reference apps' reproducible install patch; display only known purposes, never infer acceptance, and invalidate prepared inventory when consent changes.
- Block recovery writes on failed native reads or unsupported payloads and retain an older valid generation; ledger recovery unions valid slots independently from gameplay unlock rules to avoid erasing statistics.
- Keep per-key press pulses independent and submit pointer input on press-down; concurrent touch events must not overwrite each other's visible feedback or duplicate click input.
- Show a reduced-motion-aware word-win celebration before result exit; it must never run on restored results or move advertisement presentation into gameplay.
- Keep guess flips transient and cancelable, persist before animation, and lock input until the left-to-right reveal finishes; this avoids duplicate guesses, replayed flips and premature result/ad exits. Memoize dictionary-derived keyboard layouts to keep key presses responsive.
- Prepare iOS via the patched local-bundle → Capacitor sync → verified shared Release scheme → archive/export pipeline; Debug uses automatic development signing and Release uses the explicitly supplied distribution profile, with source checks guarding identity/team/profile to prevent accidental cross-app signing. Never change save keys when configuring a new store identity.
- Country percentile uses an anonymous random device id and the phone locale's region via a security-definer RPC; the table is not readable by clients and offline play hides the card.
- Keep the legacy sound field in saved snapshots for compatibility, but never initialize audio; route vibration through the guarded native haptics adapter so unavailable device feedback cannot block play.
- Reconcile save mirrors by compatible guess prefixes, preserving witnessed wins on conflict and using deterministic ties with an error notification; normal commits must retain the saved answer, language and guess prefix.
- Patch the installed iOS interstitial executor reproducibly with native inventory generations and presentation deadlines; never treat a timeout as dismissal of a visible ad, and suppress foreground welcome during fullscreen ad/consent transitions.
- Keep safety-filtered future answer pools separate from frozen dictionaries and schedules, with an explicit future epoch and saved-round compatibility; lexical screening is not a substitute for native-speaker review.
