import { ffmpeg } from "./ffmpeg";

// Designed voices differ by up to 9 dB, and `loudnorm` alone can't level them: linear mode stops at
// the peak ceiling, one-pass pumps. So: expander, mild compressor, exact gain, limiter.
const SQUEEZE = [
	"agate=threshold=0.02:ratio=2:range=0.3:attack=10:release=150",
	"acompressor=threshold=0.08:ratio=3:attack=3:release=60",
].join(",");
const TARGET = -16;
const CEILING = "alimiter=limit=0.84:attack=5:release=50:level=false";

// Integrated loudness in LUFS after the compressor. Newer ffmpeg logs a line after the JSON.
function loudness(file: string): number {
	const log = ffmpeg([
		"-i",
		file,
		"-af",
		`${SQUEEZE},loudnorm=print_format=json`,
		"-f",
		"null",
		"-",
	]);
	const start = log.lastIndexOf("{");
	return Number(JSON.parse(log.slice(start, log.indexOf("}", start) + 1)).input_i);
}

// Levels `input` into the mp3 at `output`: the only lossy encode the clip goes through.
export function level({ input, output }: { input: string; output: string }) {
	const gain = TARGET - loudness(input);
	const filter = `${SQUEEZE},volume=${gain.toFixed(2)}dB,${CEILING}`;
	ffmpeg(["-i", input, "-af", filter, "-c:a", "libmp3lame", "-b:a", "128k", output]);
}
