import { spawnSync } from "node:child_process";

// Runs ffmpeg and gives back its log: ffmpeg writes it, measurements included, to stderr.
export function ffmpeg(args: string[]): string {
	const run = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-y", ...args], {
		encoding: "utf8",
	});
	if (run.status !== 0) throw new Error(`ffmpeg ${args.join(" ")}\n${run.stderr}`);
	return run.stderr;
}
