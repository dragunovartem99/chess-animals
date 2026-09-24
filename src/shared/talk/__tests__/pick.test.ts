import { describe, expect, it } from "vitest";

import { createRng } from "../../engine";
import { pickRemark } from "../pick";

const LINES = ["Hello.", "Hi.", "Good day.", "Greetings."];

// The lines a seed says one after another, each call told the line before it.
function say({ lines, times, seed }: { lines: readonly string[]; times: number; seed: number }) {
	const rng = createRng(seed);
	const said: (string | undefined)[] = [];
	for (let turn = 0; turn < times; turn += 1) {
		said.push(pickRemark({ lines, last: said.at(-1), rng }));
	}

	return said;
}

describe("pickRemark", () => {
	it("follows the seed, never saying the same line twice running", () => {
		expect(say({ lines: LINES, times: 6, seed: 7 })).toEqual([
			"Hi.",
			"Good day.",
			"Hello.",
			"Greetings.",
			"Good day.",
			"Hi.",
		]);
		expect(say({ lines: ["Yes.", "No."], times: 4, seed: 3 })).toEqual([
			"No.",
			"Yes.",
			"No.",
			"Yes.",
		]);
	});

	it("never repeats over a long run", () => {
		const said = say({ lines: LINES, times: 60, seed: 3 });

		expect(said.filter((line, turn) => line === said[turn - 1])).toEqual([]);
	});

	it("reaches every line", () => {
		expect(new Set(say({ lines: LINES, times: 40, seed: 11 }))).toEqual(new Set(LINES));
	});

	it("repeats a lone line, says nothing with none, and draws once either way", () => {
		const rng = createRng(5);
		const twin = createRng(5);

		expect(pickRemark({ lines: ["Hm."], last: "Hm.", rng })).toBe("Hm.");
		expect(pickRemark({ lines: [], rng })).toBeUndefined();
		twin.float();
		twin.float();
		expect(rng.float()).toBe(twin.float());
	});
});
