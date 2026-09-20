import type { Rng } from "../engine";
import { spsaGains } from "./gains";
import type { SpsaConfig } from "./gains";
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

type SpsaRun = {
	iterations: number;
	config: SpsaConfig;
	rng: Rng;
	evaluate: (candidate: number[]) => Promise<number>;
	clamp: (candidate: number[]) => number[];
	onStep?: (step: SpsaStep) => void;
	best: { theta: number[]; score: number };
	scores: number[];
};

// Recursive rather than a `for` with an `await` inside: each step moves from the point the
// previous one reached, so the iterations are sequential by nature — the recursion says so,
// where a loop would read as a batch that was accidentally serialised.
async function iterate({
	run,
	current,
	iteration,
}: {
	run: SpsaRun;
	current: number[];
	iteration: number;
}): Promise<number[]> {
	if (iteration >= run.iterations) return current;

	const { clamp } = run;
	const { ak, ck } = spsaGains(run.config, iteration);
	const delta = rademacher({ size: current.length, rng: run.rng });
	const plus = clamp(current.map((value, i) => value + ck * delta[i]));
	const minus = clamp(current.map((value, i) => value - ck * delta[i]));

	const [scorePlus, scoreMinus] = await Promise.all([run.evaluate(plus), run.evaluate(minus)]);
	const slope = (scorePlus - scoreMinus) / (2 * ck);

	if (scorePlus > run.best.score) run.best = { theta: plus, score: scorePlus };
	if (scoreMinus > run.best.score) run.best = { theta: minus, score: scoreMinus };

	const score = (scorePlus + scoreMinus) / 2;
	run.scores.push(score);
	run.onStep?.({ iteration, score, ak, ck });

	const next = clamp(current.map((value, i) => value + ak * slope * delta[i]));
	return iterate({ run, current: next, iteration: iteration + 1 });
}

// Simultaneous Perturbation Stochastic Approximation, ascending: `evaluate` returns a score to be
// maximised (a gauntlet result), and every iteration costs exactly two evaluations regardless of
// the parameter count. `evaluate` is expected to be paired — the same opponents, openings and
// seeds for both probes — so `score₊ − score₋` is a low-variance difference.
export async function runSpsa({
	theta,
	clamp = (value) => value,
	...rest
}: Omit<SpsaRun, "clamp" | "best" | "scores"> & {
	theta: readonly number[];
	clamp?: (candidate: number[]) => number[];
}): Promise<SpsaResult> {
	const start = clamp([...theta]);
	const run: SpsaRun = { ...rest, clamp, best: { theta: start, score: -Infinity }, scores: [] };
	const final = await iterate({ run, current: start, iteration: 0 });
	return { theta: final, best: run.best, scores: run.scores };
}
