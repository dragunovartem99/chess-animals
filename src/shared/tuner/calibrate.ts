import type { Rng } from "../engine";
import { rademacher } from "./perturb";

// Sizes the SPSA step gain `a` from one probe pair: measure how much the gauntlet score moves for
// a `c`-sized perturbation, then pick `a` so the first update is about `targetStep` in weight
// units. Without this the caller is guessing a number that is entirely problem-dependent — a
// gauntlet score swings by hundredths, a weight by tens.
export async function calibrateStepGain({
	theta,
	c,
	targetStep,
	rng,
	evaluate,
}: {
	theta: readonly number[];
	c: number;
	targetStep: number;
	rng: Rng;
	evaluate: (candidate: number[]) => Promise<number>;
}): Promise<number> {
	const delta = rademacher({ size: theta.length, rng });
	const [plus, minus] = await Promise.all([
		evaluate(theta.map((value, i) => value + c * delta[i])),
		evaluate(theta.map((value, i) => value - c * delta[i])),
	]);

	const slope = Math.abs((plus - minus) / (2 * c));
	return targetStep / Math.max(slope, 1e-9);
}
