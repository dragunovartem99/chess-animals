---
name: talk
description: Write, rewrite or record what the animals say in the talk panel — `src/locales/{en,ru}/talk/<id>.ts` and their clips via `npm run voice` / `cli/voice/`, and the animals' voices via `voice:design` / `voice:keep`. Use when adding an animal's lines, retuning its personality, fixing a line, or recasting its voice.
---

## Lines

- DO keep who each animal is in `cli/voice/cast.yaml` — `character`, `speaks`, `voice` and the voice fields — and write every line from its `character`. Change the entry first when retuning an animal.
- DO give each animal one vivid personality no other animal has: check the whole file for a twin before adding or retuning one.
- DO react to the event the remark is about — check, a capture, a loss, the result — never a line that fits any game.
- NEVER mention how the bot plays or what it weighs: no algorithm, no heuristic, no "my king walks", no "own colour".
- NEVER name the piece in a `take` or `taken` line: the lines are not told which piece it was.
- DO keep a line to one to three short sentences; the character shows in how it reacts, not in a catchphrase or an animal noise.
- NEVER write `...`, a drawn-out sound like `р-р-р`, or a word in CAPS: plain sentences and punctuation only; the voice carries the pauses and the shouting.
- DO keep the count per remark as it is (two greet/check/take/taken, one win/loss/draw) unless asked.

## Russian

- DO write `ё` (ещё, всё, мёд, пришёл) — the lines are read aloud; the `copy` skill's no-ё rule does not apply here.
- DO make only the speaker's gender show, as its `speaks` in `cast.yaml` says.
- NEVER assume the player's gender: "Победа твоя", not "Ты выиграл".

## Voices

- DO keep one voice per animal in `cli/voice/cast.yaml`, described by `gender`, `age`, `persona` (2–5 words), `emotion` (2–3 adjectives) and `delivery` (1–2 sentences on timbre, pace, delivery). `cli/voice/describe.ts` builds the Voice Design prompt from them; change the fields, never the prompt by hand.
- DO note a stock or library voice in a comment after its `voice` id.
- DO design a new voice with `npm run voice:design -- <id>`: three previews of the animal's Russian lines into `~/Claude/chess-animals/voices/<id>-<n>.mp3`; a rerun numbers on. Let the user listen and pick a number.
- DO keep the pick with `npm run voice:keep -- <id> <n>`: it saves the voice, writes its id into `cast.yaml` and drops the animal's clips. It asks before deleting the old designed voice — pipe `y` only after the user's explicit yes for that voice.
- DO hear a kept voice in both languages (record its clips) before moving on.
- DO try a Voice Library voice (`/v1/shared-voices`) when a stock one does not fit: it speaks by its id without a slot. Check its rate first.
- DO prefer a library voice over designing one: the land animals all speak with library voices, and a custom slot is only worth spending where the library has nothing.
- DO keep the animals' voices clearly apart in pitch, age and pace from each other.
- DO name a custom voice `chess-animals · <roster> · <id>` in ElevenLabs.
- DO keep the Russian accent a Russian-sample voice carries into English under v3: `language_code` does not remove it, and it suits the animals.
- DO raise `AT_ONCE` in `cli/voice/speak.ts` to the plan's concurrency; Free allows two.
- NEVER stretch the quota with several free accounts: it breaks ElevenLabs' terms, and a public site needs the paid plan's commercial licence anyway.

## Workflow

1. Write the English and Russian lines for the animal as a pair.
2. Run `npx vitest run src/locales src/shared/talk`.
3. Delete the changed clips under `public/voice/{en,ru}/<id>/` — only missing clips are recorded.
4. Run `npm run voice`: it prints the clip and character count and asks. On a big run show the count to the user and wait for a yes before piping `y`.
5. Give the user a `vlc --play-and-exit` command for the new clips (mpv is not installed).
