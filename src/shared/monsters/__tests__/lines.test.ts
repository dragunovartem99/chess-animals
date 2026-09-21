import { describe, expect, it } from "vitest";

import { createRng } from "../../engine";
import { parseLines, pickLine } from "../lines";

const info = (index: number, score: string, move: string, depth = 5) =>
	`info depth ${depth} seldepth 7 multipv ${index} score ${score} nodes 900 nps 1 pv ${move} e7e5`;

describe("parseLines", () => {
	it("reads the lines of the last depth, best first", () => {
		const said = [
			info(1, "cp 30", "d2d4", 4),
			info(2, "cp 20", "e2e4", 4),
			info(3, "cp 10", "g1f3", 4),
			info(1, "cp 35", "e2e4"),
			info(2, "cp 25", "g1f3"),
			"bestmove e2e4 ponder e7e5",
		];

		expect(parseLines(said)).toEqual([
			{ move: "e2e4", score: 35 },
			{ move: "g1f3", score: 25 },
		]);
	});

	it("keeps a line the budget cut short, on the score it reports", () => {
		const said = [info(1, "cp 30", "d2d4"), info(2, "cp 17 upperbound", "e2e3")];

		expect(parseLines(said)).toEqual([
			{ move: "d2d4", score: 30 },
			{ move: "e2e3", score: 17 },
		]);
	});

	it("puts mate past any material, and a sooner mate further out", () => {
		const said = [
			info(1, "mate 1", "h5f7"),
			info(2, "mate 3", "d1h5"),
			info(3, "mate -2", "a2a3"),
		];
		const [one, three, mated] = parseLines(said).map((line) => line.score);

		expect(one).toBeGreaterThan(three!);
		expect(three).toBeGreaterThan(10_000);
		expect(mated).toBeLessThan(-10_000);
	});

	it("ignores everything that is not a line", () => {
		expect(parseLines(["info string NNUE enabled", "readyok", "bestmove (none)"])).toEqual([]);
	});
});

describe("pickLine", () => {
	const lines = [
		{ move: "best", score: 50 },
		{ move: "close", score: 40 },
		{ move: "blunder", score: -250 },
	];
	const tally = (temperature: number, seed = "s") => {
		const rng = createRng(seed);
		const counts: Record<string, number> = { best: 0, close: 0, blunder: 0 };
		for (let draw = 0; draw < 1000; draw++)
			counts[pickLine({ lines, temperature, rng })!.move]++;

		return counts;
	};

	it("plays the best line every time at zero temperature", () => {
		expect(tally(0)).toEqual({ best: 1000, close: 0, blunder: 0 });
	});

	it("slips often to a close line and seldom to a blunder", () => {
		const counts = tally(30);

		expect(counts.close).toBeGreaterThan(300);
		expect(counts.best).toBeGreaterThan(counts.close!);
		expect(counts.blunder).toBe(0);
		expect(tally(200).blunder).toBeGreaterThan(50);
	});

	it("replays from its seed", () => {
		expect(tally(30, "a")).toEqual(tally(30, "a"));
		expect(tally(30, "a")).not.toEqual(tally(30, "b"));
	});

	it("draws once a call however it picks, so the stream does not hang on the position", () => {
		const cold = createRng("s");
		const hot = createRng("s");
		pickLine({ lines, temperature: 0, rng: cold });
		pickLine({ lines: lines.slice(0, 1), temperature: 50, rng: hot });

		expect(cold.state()).toEqual(hot.state());
	});

	it("has nothing to pick with no lines", () => {
		expect(pickLine({ lines: [], temperature: 30, rng: createRng(1) })).toBeUndefined();
	});
});
