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
- Keep advertisements disabled until native consent and presentation are integrated and verified; gameplay must not depend on ads.
- Compute game-day keys from the device timezone's wall-clock parts; this preserves the daily boundary across daylight-saving transitions.
- Use a frozen seeded answer shuffle from the new schedule epoch while retaining existing saved answers; offline restarts must not reroll puzzles.
- Isolate interstitial policy behind an injectable adapter; consent precedes preload and result dismissal consumes ready inventory without blocking gameplay.
- Keep the app's own iOS project and privacy manifest separate from reference apps; production identifiers and signing must never be copied.
- Use Yatzy's language registry, native device-language detection and bundled translations; fallback copy is English until each locale is fully reviewed.
- Store the chosen word language on each dated round and lock it after the first valid guess; switching languages must never grant another daily game or lose statistics.
- Key daily words by date and bounded slot, retaining the original date-only key for the first word; unlock subsequent slots only after completion and keep streaks based on winning days rather than word count.
- Segment words into Unicode grapheme clusters; use the native text keyboard for scripts that cannot fit a fixed alphabet keyboard.
- Bundle frequency-derived candidate dictionaries separately under their data license; languages without adequate offline word data remain unavailable rather than silently using another language's words.
- Show a state-aware welcome dialog on cold launch and native foreground entry; visibility changes cover the browser preview without replaying on focus alone.
