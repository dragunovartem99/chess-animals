---
name: copy
description: Write or rewrite the player-facing text — bot names and descriptions in `src/locales/{en,ru}/bots.ts`, and the UI prose in `src/locales/{en,ru}/index.ts` (tagline, roster lead, breakdown blurbs, placeholders). Use when adding an animal, retuning its voice, or the user asks for better wording anywhere on the site.
---

## Voice

- DO use only words a 6-year-old knows. No chess terms (no "material", "tempo", "file", "king safety"), no strategy words, no numbers spelled into the prose.
- DO write short. One sentence per idea, roughly 6–14 words. Two sentences max per description.
- DO write in plain present tense, active voice. The animal does things; it is never "designed to" or "known for".
- DO give each animal the attitude of its one idea — show the behaviour, never explain the heuristic behind it. "The whole pack runs at your king", not "weights proximity to the enemy king".
- DO address the reader as "you" where it lands naturally ("your king", "beat one"), but don't force it.
- DO NOT sell. No "ranked in seconds", no "explore personalities", no feature-list tone.
- DO NOT use an emoji in `bots.ts` or `index.ts` strings — these are prose, not chat lines.

## Bot names and descriptions (`src/locales/{en,ru}/bots.ts`)

- DO edit the `en` and `ru` files as a pair; a key in one and not the other is a type error.
- DO keep `name` to the plain animal word ("Wolf" / "Волк"), unless the user asks otherwise.
- DO make `description` one or two sentences: what it does on the board, in its own character.
- DO vary sentence shape across the roster — not every description opens "The animal …".

## UI prose (`src/locales/{en,ru}/index.ts`)

- DO keep `app.tagline` one line, no animal count baked in (the roster grows).
- DO keep `roster.lead` an invitation, not a description of the page.
- DO keep interpolation placeholders (`{name}`, `{phase}`) exactly as they are.
- DO keep the factual blurbs (`game.breakdown.*`) accurate — plainer wording is fine, wrong wording is not.

## Russian

- NEVER use the letter `ё`; write `е`.
- DO write it as its own natural kid-Russian sentence — match the English line's vibe, not its word order.
- DO keep it as short and plain as the English; no bookish or formal phrasing.
- NEVER pad with "одного" before `короля` when nothing is being contrasted.

## Workflow

1. Read both locale files and an existing sibling animal for tone.
2. Write the English strings following the voice rules.
3. Write the Russian to mirror the meaning, not the words.
4. Run `npm run types:check` and `npm run test` — the locale coverage spec holds the two sets to each other.
