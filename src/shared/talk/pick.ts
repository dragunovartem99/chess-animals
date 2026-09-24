import type { Rng } from "../engine";

// One of a bot's lines for an event, never `last` again when there is another to say: a line
// heard twice running is when a bot stops sounding like someone. One draw every call, even with
// a single line, so the stream does not depend on how many lines an animal has.
export function pickRemark({
	lines,
	last,
	rng,
}: {
	lines: readonly string[];
	last?: string;
	rng: Rng;
}): string | undefined {
	const skip = lines.length > 1 && last !== undefined ? lines.indexOf(last) : -1;
	const index = rng.int(Math.max(lines.length - (skip === -1 ? 0 : 1), 1));

	return lines[skip !== -1 && index >= skip ? index + 1 : index];
}
