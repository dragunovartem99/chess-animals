import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Clip } from "@/shared/talk";

import { level } from "./level";

export type Job = Clip & { voice: string };

// v3 over multilingual v2: it acts the line rather than reading it, and pauses at a full stop or
// an ellipsis by itself, where v2 ran "Oh. Hello. Sorry." together in one breath and needed a
// `<break>` tag between sentences — a tag v3 does not take. One voice still carries both
// languages. Fetched at the best mp3 the plan gives, since `level` re-encodes it and a thin source
// only gets thinner.
const MODEL = "eleven_v3";
const FORMAT = "mp3_44100_192";
// v3 takes only 0, 0.5 or 1: 0.5 is its "natural", steady enough without flattening the acting.
const SETTINGS = { stability: 0.5, similarity_boost: 0.75 };
// Two requests at once: the account's plan refuses a third in flight with a 429.
const AT_ONCE = 2;

const publicDir = path.join(import.meta.dirname, "..", "..", "public");

async function record({ job, key }: { job: Job; key: string }) {
	const response = await fetch(
		`https://api.elevenlabs.io/v1/text-to-speech/${job.voice}?output_format=${FORMAT}`,
		{
			method: "POST",
			headers: { "xi-api-key": key, "content-type": "application/json" },
			body: JSON.stringify({
				text: job.text,
				model_id: MODEL,
				voice_settings: SETTINGS,
			}),
		}
	);
	if (!response.ok) throw new Error(`${job.path}: ${response.status} ${await response.text()}`);

	const scratch = mkdtempSync(path.join(tmpdir(), "voice-"));
	const raw = path.join(scratch, "raw.mp3");
	writeFileSync(raw, Buffer.from(await response.arrayBuffer()));
	const file = path.join(publicDir, job.path);
	mkdirSync(path.dirname(file), { recursive: true });
	level({ input: raw, output: file });
	rmSync(scratch, { recursive: true });
	console.log(`${job.path}  ${job.text}`);
}

// Records every clip not already on disk: a clip once made is never paid for again, so a run
// after a changed line only records that line. Gives back how many it recorded.
export async function speak({ jobs, key }: { jobs: Job[]; key: string }): Promise<number> {
	const missing = jobs.filter((job) => !existsSync(path.join(publicDir, job.path)));
	const batches = Array.from({ length: Math.ceil(missing.length / AT_ONCE) }, (_, index) =>
		missing.slice(index * AT_ONCE, (index + 1) * AT_ONCE)
	);
	await batches.reduce(async (done, batch) => {
		await done;
		await Promise.all(batch.map((job) => record({ job, key })));
	}, Promise.resolve());

	return missing.length;
}
