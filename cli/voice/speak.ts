import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Clip } from "@/shared/talk";

import { eleven } from "./eleven";
import { level } from "./level";
import { publicFile } from "./paths";

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
// Five requests at once: the concurrency the account's plan allows.
const AT_ONCE = 5;

async function record(job: Job) {
	const response = await eleven({
		route: `/v1/text-to-speech/${job.voice}?output_format=${FORMAT}`,
		body: { text: job.text, model_id: MODEL, voice_settings: SETTINGS },
	});
	const scratch = mkdtempSync(path.join(tmpdir(), "voice-"));
	const raw = path.join(scratch, "raw.mp3");
	writeFileSync(raw, Buffer.from(await response.arrayBuffer()));
	mkdirSync(path.dirname(publicFile(job.path)), { recursive: true });
	level({ input: raw, output: publicFile(job.path) });
	rmSync(scratch, { recursive: true });
	console.log(`${job.path}  ${job.text}`);
}

// The clips not on disk yet: a clip once made is never paid for again, so a run after a changed
// line (its clip deleted) only records that line.
export const unrecorded = (jobs: Job[]) => jobs.filter((job) => !existsSync(publicFile(job.path)));

export async function speak(jobs: Job[]) {
	const batches = Array.from({ length: Math.ceil(jobs.length / AT_ONCE) }, (_, index) =>
		jobs.slice(index * AT_ONCE, (index + 1) * AT_ONCE)
	);
	await batches.reduce(async (done, batch) => {
		await done;
		await Promise.all(batch.map((job) => record(job)));
	}, Promise.resolve());
}
