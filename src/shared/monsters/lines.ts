import type { Rng } from "../engine";

// One of Stockfish's candidate moves, scored in centipawns from the side to move's view.
export type Line = { move: string; score: number };

// Mate folded into centipawns past anything material can reach, sooner mates further out, so a
// forced mate outweighs every line and being mated is worse the faster it comes.
export const MATE = 100_000;

const INFO = /\bmultipv (\d+) score (cp|mate) (-?\d+)\b.*?\bpv (\S+)/u;

// The candidates a search ended on, best first. Stockfish prints its lines again, `multipv 1`
// first, every time it finishes a depth, so the last batch wins — keeping each index's last word
// instead mixes depths, and a move that climbed a rank shows up twice. A search stopped on its
// node budget reports the lines it had not reached yet as bounds, on the last depth's score; they
// are kept, because dropping them would leave an animal told to weigh five moves weighing three.
export function parseLines(output: readonly string[]): Line[] {
	let batch: Line[] = [];

	for (const line of output) {
		const match = INFO.exec(line);
		if (!match) continue;

		const [, index, kind, value, move] = match;
		const number = Number(value);
		const score = kind === "cp" ? number : Math.sign(number) * MATE - number;
		if (index === "1") batch = [];
		batch.push({ move: move!, score });
	}

	return batch;
}

// Picks a line, weighing one `d` centipawns behind the best `exp(-d / temperature)`. One draw
// every call, even at zero temperature or with a single line, so the stream does not depend on
// the position.
export function pickLine({
	lines,
	temperature,
	rng,
}: {
	lines: readonly Line[];
	temperature: number;
	rng: Rng;
}): Line | undefined {
	const roll = rng.float();
	const best = Math.max(...lines.map((line) => line.score));
	if (temperature <= 0) return lines.find((line) => line.score === best);

	const weights = lines.map((line) => Math.exp((line.score - best) / temperature));
	let left = roll * weights.reduce((sum, weight) => sum + weight, 0);

	return lines.find((_, index) => (left -= weights[index]!) < 0) ?? lines.at(-1);
}
