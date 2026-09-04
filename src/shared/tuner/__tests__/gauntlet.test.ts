import { describe, expect, it } from "vitest";

import { createGauntlet, defaultTuneSpec } from "..";
import type { BotDefinition } from "../../bots";
import type { GameReport, GameSpec } from "../../scheduler";

const candidate: BotDefinition = {
	id: "cand",
	search: { depth: 1 },
	temperature: 0,
	weights: { materialPawn: 20, swarm: -10 },
};

const opponent = (id: string): { id: string; definition: BotDefinition } => ({
	id,
	definition: { id, search: { depth: 1 }, temperature: 0, weights: {} },
});

const openings = [
	{ id: "op-a", fen: "fen-a" },
	{ id: "op-b", fen: "fen-b" },
];

describe("createGauntlet", () => {
	it("plays every opponent × opening × colour", () => {
		const { gameCount } = createGauntlet({
			candidate,
			spec: defaultTuneSpec(candidate.weights),
			opponents: [opponent("x"), opponent("y")],
			openings,
			run: () => Promise.resolve([]),
		});
		expect(gameCount).toBe(2 * 2 * 2);
	});

	it("scores mean points per game from the candidate's side", async () => {
		const results: GameReport["result"][] = ["white", "black", null, "white", "black", "black"];
		const { evaluate } = createGauntlet({
			candidate,
			spec: defaultTuneSpec(candidate.weights),
			opponents: [opponent("x")],
			openings: [openings[0], openings[1], { id: "op-c", fen: "fen-c" }],
			run: (specs: GameSpec[]) =>
				Promise.resolve(
					specs.map((_, i) => ({
						result: results[i],
						reason: "checkmate" as const,
						plies: 30,
					}))
				),
		});

		// candidate: win@0 (white), win@1 (black), draw@2, loss@3, loss@4, win@5 → 3.5 / 6
		expect(await evaluate([20, -10])).toBeCloseTo(3.5 / 6, 10);
	});

	it("uses the same game seeds regardless of the weights (common random numbers)", async () => {
		const seen: number[][] = [];
		const gauntlet = createGauntlet({
			candidate,
			spec: defaultTuneSpec(candidate.weights),
			opponents: [opponent("x")],
			openings,
			run: (specs) => {
				seen.push(specs.map((spec) => spec.seed));
				return Promise.resolve(
					specs.map(() => ({ result: null, reason: "checkmate", plies: 1 }))
				);
			},
		});

		await gauntlet.evaluate([20, -10]);
		await gauntlet.evaluate([999, 999]);
		expect(seen[0]).toEqual(seen[1]);
	});
});
