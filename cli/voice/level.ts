import { ffmpeg } from "./ffmpeg";

// Every clip is brought to one loudness, since designed voices come out as much as 9 dB apart and
// a whisper after a shout would have the listener reach for the volume. `loudnorm` alone cannot
// do it: its linear mode stops at the peak ceiling, and a clip of quiet talk ending in a squawk
// stayed 8 dB short, while its one-pass mode pumps on a clip of a second or two. So a compressor
// evens the performance out, the gain to the target is measured on that and applied exactly, and
// a limiter takes the few peaks the gain pushes over. The gain lifts breaths along with the words,
// so an expander first turns down whatever sits under speech, by 10 dB at most, and the
// compressor is kept mild.
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
