import type { Role } from "chessops/types";

import { locales, messages } from "@/locales";
import { MONSTERS, ROSTER } from "@/modules/bots/roster";
import { clipsFor } from "@/shared/talk";
import type { Clip, Remark } from "@/shared/talk";

import { CASTING } from "./voice/casting";
import { speak } from "./voice/speak";
import type { Job } from "./voice/speak";

// `npm run voice` — record every land animal's and monster's lines with ElevenLabs into
// `public/voice/`. Billed per character, so it is never part of the build: run it by hand after
// the lines change, and only the clips that are not on disk yet are recorded. The key comes from
// `.env.local`.

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("ELEVENLABS_API_KEY is not set: put it in .env.local");

type Lines = Partial<Record<Remark, readonly string[]>>;

// Every clip one animal has, in every language.
function clipsOf(id: string): Clip[] {
	return locales.flatMap((locale) => {
		const words = messages[locale];
		return clipsFor({
			locale,
			id,
			lines: (words.talk as Record<string, Lines>)[id] ?? {},
			pieces: words.game.talk.piece as Record<Role, string>,
		});
	});
}

const jobs = [...ROSTER, ...MONSTERS].flatMap((animal) => {
	const { id } = animal.definition;
	const voice = CASTING[id];
	if (!voice) throw new Error(`${id} has lines but no voice in cli/voice/casting.ts`);

	return clipsOf(id).map((clip): Job => ({ path: clip.path, text: clip.text, voice }));
});
console.log(`${await speak({ jobs, key })} clips recorded`);
