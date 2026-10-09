import { locales, messages } from "@/locales";
import { ANIMALS } from "@/modules/bots/roster";
import { clipsFor } from "@/shared/talk";
import type { Clip, Remark } from "@/shared/talk";

import { CAST } from "./voice/casting";
import { confirm } from "./voice/eleven";
import { speak, unrecorded } from "./voice/speak";
import type { Job } from "./voice/speak";

// `npm run voice` records missing clips with ElevenLabs into `public/voice/`. Billed per character,
// so never part of the build: run by hand after the lines change.

type Lines = Partial<Record<Remark, readonly string[]>>;

// Every clip one animal has, in every language.
function clipsOf(id: string): Clip[] {
	return locales.flatMap((locale) =>
		clipsFor({ locale, id, lines: (messages[locale].talk as Record<string, Lines>)[id] ?? {} })
	);
}

const jobs = ANIMALS.flatMap((animal) => {
	const { id } = animal.definition;
	const voice = CAST[id]?.voice;
	if (!voice) throw new Error(`${id} has lines but no voice in cli/voice/cast.yaml`);

	return clipsOf(id).map(({ path, text }): Job => ({ path, text, voice }));
});

const missing = unrecorded(jobs);
const characters = missing.reduce((sum, job) => sum + job.text.length, 0);
if (missing.length === 0) console.log("every clip is recorded");
else if (await confirm(`${missing.length} clips, ${characters} characters. Record them?`)) {
	await speak(missing);
	console.log(`${missing.length} clips recorded`);
}
