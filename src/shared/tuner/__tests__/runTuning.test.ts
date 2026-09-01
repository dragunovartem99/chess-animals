import { describe, expect, it } from "vitest";

import { runTuning } from "..";
import type { BotDefinition } from "../../bots";
import type { GameReport, GameSpec } from "../../scheduler";

const BOT_ID = "wolf";
const TUNE_KEYS = ["swarm", "materialPawn", "materialKnight"] as const;
const TARGET: Record<string, number> = { swarm: -180, materialPawn: 20, materialKnight: 60 };

// Deliberately detuned: `swarm` has the wrong sign, the piece values are far too low.
const detuned: BotDefinition = {
	id: BOT_ID,
	search: { depth: 1 },
	temperature: 0,
	weights: { middlegame: { swarm: 100, materialPawn: 8, materialKnight: 30 } },
};

const opponent = (id: string): { id: string; definition: BotDefinition } => ({
	id,
	definition: { id, search: { depth: 1 }, temperature: 0, weights: { middlegame: {} } },
});

const openings = Array.from({ length: 4 }, (_, i) => ({ id: `op${i}`, fen: `fen-${i}` }));

function rand(seed: number): number {
	let t = (seed >>> 0) + 0x6d2b79f5;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// How close the candidate's tuned weights are to the ideal — the stand-in for real strength.
function quality(definition: BotDefinition): number {
	const w = definition.weights.middlegame;
	return -TUNE_KEYS.reduce((sum, key) => sum + ((w[key] ?? 0) - TARGET[key]) ** 2, 0) / 20000;
}

// A synthetic pool: the candidate's win chance rises with its weight quality, plus a white edge
// and a draw band, decided by the spec seed.
function fakeRun(specs: GameSpec[]): Promise<GameReport[]> {
	return Promise.resolve(
		specs.map((spec) => {
			const candidateWhite = spec.white.id === BOT_ID;
			const candidate = candidateWhite ? spec.white : spec.black;
			const edge = quality(candidate) + 2 + (candidateWhite ? 0.2 : -0.2);
			const pCandidate = 1 / (1 + Math.exp(-edge));
			const roll = rand(spec.seed);
			const candidateResult =
				roll < pCandidate - 0.1 ? "win" : roll > pCandidate + 0.1 ? "loss" : "draw";
			const result =
				candidateResult === "draw"
					? null
					: (candidateResult === "win") === candidateWhite
						? "white"
						: "black";
			return { result, reason: "checkmate", plies: 30 };
		})
	);
}

describe("runTuning", () => {
	it("raises the gauntlet score of a detuned bot", async () => {
		const result = await runTuning({
			definition: detuned,
			opponents: [opponent("fox"), opponent("cat")],
			openings,
			iterations: 60,
			seed: 3,
			perturbation: 25,
			targetStep: 30,
			run: fakeRun,
		});

		expect(result.final).toBeGreaterThan(result.baseline + 0.05);
		// The wrong-signed weight is pulled back below zero.
		expect(result.tuned.weights.middlegame.swarm).toBeLessThan(0);
		expect(result.spsa.scores).toHaveLength(60);
	}, 20_000);

	it("returns the bot's own id and shape", async () => {
		const result = await runTuning({
			definition: detuned,
			opponents: [opponent("fox")],
			openings: [openings[0]],
			iterations: 3,
			run: fakeRun,
		});
		expect(result.tuned.id).toBe(BOT_ID);
		expect(Object.keys(result.tuned.weights.middlegame).toSorted()).toEqual([
			"materialKnight",
			"materialPawn",
			"swarm",
		]);
	});
});
