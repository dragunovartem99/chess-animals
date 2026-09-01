// The SPSA gain sequences, in Spall's standard form. `ak` scales the step, `ck` the perturbation;
// both decay, `ck` more slowly so the gradient estimate stays informative as the step shrinks.
// `A` (the "stability constant") damps the first, largest steps — set it to a few percent of the
// run length. `alpha` and `gamma` are the textbook 0.602 / 0.101 for a finite-sample run.
export type SpsaConfig = {
	a: number;
	c: number;
	A?: number;
	alpha?: number;
	gamma?: number;
};

export function spsaGains(config: SpsaConfig, iteration: number): { ak: number; ck: number } {
	const { a, c, A = 0, alpha = 0.602, gamma = 0.101 } = config;
	const k = iteration + 1;
	return {
		ak: a / (k + A) ** alpha,
		ck: c / k ** gamma,
	};
}
