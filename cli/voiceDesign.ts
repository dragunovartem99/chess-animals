import { mkdirSync, writeFileSync } from "node:fs";

import { messages } from "@/locales";

import { CAST } from "./voice/casting";
import { describe } from "./voice/describe";
import { eleven } from "./voice/eleven";
import { PREVIEW_DIR } from "./voice/paths";
import { previewFile, readPreviews, writePreviews } from "./voice/previews";
import type { Preview } from "./voice/previews";

// `npm run voice:design -- <id>` — design three voice previews for an animal from its entry in
// `cast.yaml`, into `~/Claude/chess-animals/voices/<id>-<n>.mp3`. A rerun numbers on from the last,
// so earlier candidates stay to compare. Keep one with `npm run voice:keep -- <id> <n>`.

const id = process.argv[2];
const cast = CAST[id];
if (!cast) throw new Error(`no ${id} in cli/voice/cast.yaml`);

// The animal's own Russian lines, one after another: the voice is designed on what it will say,
// and a Russian sample gives it the accent it keeps in English. ElevenLabs takes 100–1000
// characters, so the lines stop at the last one that fits.
const lines = Object.values(messages.ru.talk[id as keyof typeof messages.ru.talk]).flat();
const sample = lines.reduce(
	(text, line) => (text.length + line.length < 1000 ? `${text} ${line}`.trim() : text),
	""
);
if (sample.length < 100) throw new Error(`${id} has too few lines for a sample: ${sample}`);

const seed = Math.floor(Math.random() * 2 ** 31);
const response = await eleven({
	route: "/v1/text-to-voice/design?output_format=mp3_44100_192",
	body: { voice_description: describe(cast), model_id: "eleven_ttv_v3", text: sample, seed },
});
const { previews } = (await response.json()) as {
	previews: { audio_base_64: string; generated_voice_id: string }[];
};

const earlier = readPreviews(id);
mkdirSync(PREVIEW_DIR, { recursive: true });
const made = previews.map((preview, index): Preview => {
	const n = earlier.length + index + 1;
	writeFileSync(previewFile({ id, n }), Buffer.from(preview.audio_base_64, "base64"));
	return { n, generatedVoiceId: preview.generated_voice_id, seed };
});
writePreviews({ id, previews: [...earlier, ...made] });
console.log(made.map(({ n }) => previewFile({ id, n })).join("\n"));
