---
name: talk
description: Write, rewrite or record what the animals say in the talk panel — `src/locales/{en,ru}/talk/<id>.ts` and their clips via `npm run voice` / `cli/voice/`. Use when adding an animal's lines, retuning its personality, fixing a line, or recasting its voice.
---

## Lines

- DO give each animal one vivid personality (cocky, shy, lazy, pompous, creepy…) and let every line come from it.
- DO react to the event the remark is about — check, a capture, a loss, a mate coming, the result — never a line that fits any game.
- NEVER mention how the bot plays or what it weighs: no algorithm, no heuristic, no "my king walks", no "own colour".
- NEVER put `{piece}` in a line: a line that names the piece is recorded five times over.
- DO keep a line to one to three short sentences; the character shows in how it reacts, not in a catchphrase or an animal noise.
- DO keep the count per remark as it is (two greet/check/take/lose, one mating/win/loss/draw) unless asked.

## Russian

- DO write `ё` (ещё, всё, мёд, пришёл) — the lines are read aloud; the `copy` skill's no-ё rule does not apply here.
- DO make only the speaker's gender show: the Fox and the Dove speak as women, the rest as men, the Wolf as "we".
- NEVER assume the player's gender: "Победа твоя", not "Ты выиграл".

## Voices

- DO keep one voice per animal in `cli/voice/casting.ts`, with its description beside it.
- DO design a new voice from a Russian sample with ellipses, and hear it in both languages before keeping it.
- DO keep the animals' voices clearly apart in pitch, age and pace from each other.
- DO name a custom voice `chess-animals · <roster> · <id>` in ElevenLabs.
- DO keep the Russian accent a Russian-sample voice carries into English under v3: `language_code` does not remove it, and it suits the animals.
- DO raise `AT_ONCE` in `cli/voice/speak.ts` to the plan's concurrency; Free allows two.
- NEVER stretch the quota with several free accounts: it breaks ElevenLabs' terms, and a public site needs the paid plan's commercial licence anyway.

## Workflow

1. Write the English and Russian lines for the animal as a pair.
2. Run `npx vitest run src/locales src/shared/talk`.
3. Delete the changed clips under `public/voice/{en,ru}/<id>/` — only missing clips are recorded.
4. Run `npm run voice` and give the user an `mpv` command for the new clips.
