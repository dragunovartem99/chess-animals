import type { Rng } from "../engine";
import { type SpsaConfig, spsaGains } from "./gains";
import { rademacher } from "./perturb";

export type SpsaStep = {
	iteration: number;
	// The mean of the two probe scores — a cheap running estimate of how the current point does.
	score: number;
	ak: number;
	ck: number;
};

export type SpsaResult = {
	theta: number[];
	// The best single probe seen and the point that produced it — SPSA's own trajectory can step
	// past a good spot, so the caller usually re-evaluates this on a bigger gauntlet.
	best: { theta: number[]; score: number };
	scores: number[];
};

// Simultaneous Perturbation Stochastic Approximation, ascending: `evaluate` returns a score to be
// maximised (a gauntlet result), and every iteration costs exactly two evaluations regardless of
// the parameter count. `evaluate` is expected to be paired — the same opponents, openings and
// seeds for both probes — so `score₊ − score₋` is a low-variance difference.
export async function runSpsa({
	theta,
	iterations,
	config,
	rng,
	evaluate,
	clamp = (value) => value,
	onStep,
}: {
	theta: readonly number[];
	iterations: number;
	config: SpsaConfig;
	rng: Rng;
	evaluate: (candidate: number[]) => Promise<number>;
	clamp?: (candidate: number[]) => number[];
	onStep?: (step: SpsaStep) => void;
}): Promise<SpsaResult> {
	let current = clamp([...theta]);
	let best = { theta: current, score: -Infinity };
	const scores: number[] = [];

	for (let iteration = 0; iteration < iterations; iteration += 1) {
		const { ak, ck } = spsaGains(config, iteration);
		const delta = rademacher({ size: current.length, rng });
		const plus = clamp(current.map((value, i) => value + ck * delta[i]));
		const minus = clamp(current.map((value, i) => value - ck * delta[i]));

		const [scorePlus, scoreMinus] = await Promise.all([evaluate(plus), evaluate(minus)]);
		const slope = (scorePlus - scoreMinus) / (2 * ck);
		current = clamp(current.map((value, i) => value + ak * slope * delta[i]));

		for (const [candidate, score] of [
			[plus, scorePlus],
			[minus, scoreMinus],
		] as const) {
			if (score > best.score) best = { theta: candidate, score };
		}

		const score = (scorePlus + scoreMinus) / 2;
		scores.push(score);
		onStep?.({ iteration, score, ak, ck });
	}

	return { theta: current, best, scores };
}
