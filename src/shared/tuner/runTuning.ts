import type { BotDefinition } from "../bots";
import { createRng, type Rng } from "../engine";
import type { GameReport, GameSpec } from "../scheduler";
import { calibrateStepGain } from "./calibrate";
import { createGauntlet, type GauntletBot, type GauntletOpening } from "./gauntlet";
import { defaultTuneSpec, fromVector, toVector } from "./parameters";
import { runSpsa, type SpsaResult, type SpsaStep } from "./spsa";

export type TuningResult = {
	tuned: BotDefinition;
	// Mean gauntlet points per game, before and after — the run is worth keeping only if it rose.
	baseline: number;
	final: number;
	spsa: SpsaResult;
};

type Evaluate = (candidate: number[]) => Promise<number>;

// Calibrate the step gain from one warm-up probe, then ascend.
async function ascend({
	theta,
	iterations,
	perturbation,
	targetStep,
	rng,
	evaluate,
	onStep,
}: {
	theta: number[];
	iterations: number;
	perturbation: number;
	targetStep: number;
	rng: Rng;
	evaluate: Evaluate;
	onStep?: (step: SpsaStep) => void;
}): Promise<SpsaResult> {
	const a = await calibrateStepGain({ theta, c: perturbation, targetStep, rng, evaluate });
	return runSpsa({
		theta,
		iterations,
		config: { a, c: perturbation, A: Math.max(1, iterations * 0.1) },
		rng,
		evaluate,
		onStep,
	});
}

export type TuningOptions = {
	definition: BotDefinition;
	opponents: readonly GauntletBot[];
	openings: readonly GauntletOpening[];
	iterations: number;
	seed?: number;
	plyLimit?: number;
	perturbation?: number;
	targetStep?: number;
	run: (specs: GameSpec[]) => Promise<GameReport[]>;
	onStep?: (step: SpsaStep) => void;
};

// One SPSA run against a fixed gauntlet: ascend for `iterations`, then re-score the best point the
// run saw. `run` is the game runner — the CLI passes the worker pool; a test passes a synthetic
// one.
export async function runTuning({
	definition,
	opponents,
	openings,
	iterations,
	seed = 1,
	plyLimit = 160,
	perturbation = 8,
	targetStep = 6,
	run,
	onStep,
}: TuningOptions): Promise<TuningResult> {
	const spec = defaultTuneSpec(definition.weights);
	const theta0 = toVector(definition.weights, spec);
	const rng = createRng(seed);
	const { evaluate } = createGauntlet({
		candidate: definition,
		spec,
		opponents,
		openings,
		seed,
		plyLimit,
		run,
	});

	const baseline = await evaluate(theta0);
	const spsa = await ascend({
		theta: theta0,
		iterations,
		perturbation,
		targetStep,
		rng,
		evaluate,
		onStep,
	});
	const final = await evaluate(spsa.best.theta);

	return {
		tuned: { ...definition, weights: fromVector(definition.weights, spec, spsa.best.theta) },
		baseline,
		final,
		spsa,
	};
}
