import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { Clip } from "@/shared/talk";

export type Job = Clip & { voice: string };

// Multilingual, so one voice carries both languages; small mp3s, since a clip is a second or two.
const MODEL = "eleven_multilingual_v2";
const FORMAT = "mp3_44100_64";
// Two requests at once: the account's plan refuses a third in flight with a 429.
const AT_ONCE = 2;

const publicDir = path.join(import.meta.dirname, "..", "..", "public");

async function record({ job, key }: { job: Job; key: string }) {
	const response = await fetch(
		`https://api.elevenlabs.io/v1/text-to-speech/${job.voice}?output_format=${FORMAT}`,
		{
			method: "POST",
			headers: { "xi-api-key": key, "content-type": "application/json" },
			body: JSON.stringify({ text: job.text, model_id: MODEL }),
		}
	);
	if (!response.ok) throw new Error(`${job.path}: ${response.status} ${await response.text()}`);

	const file = path.join(publicDir, job.path);
	mkdirSync(path.dirname(file), { recursive: true });
	writeFileSync(file, Buffer.from(await response.arrayBuffer()));
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
