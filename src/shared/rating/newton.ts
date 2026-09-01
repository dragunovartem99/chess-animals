import { solve } from "./linalg";
import type { Objective } from "./model";

const STEP = 1e-4;

// Central-difference Hessian built from the analytic gradient — one derivative to get right
// instead of two. Symmetrised to kill the small asymmetry the differencing leaves.
function hessian(objective: Objective, x: readonly number[]): number[][] {
	const n = objective.size;
	const columns: number[][] = [];

	for (let k = 0; k < n; k += 1) {
		const up = [...x];
		const down = [...x];
		up[k] += STEP;
		down[k] -= STEP;
		const gradUp = objective.evaluate(up).grad;
		const gradDown = objective.evaluate(down).grad;
		columns.push(gradUp.map((value, i) => (value - gradDown[i]) / (2 * STEP)));
	}

	return columns.map((_, i) => columns.map((column, j) => (column[i] + columns[i][j]) / 2));
}

const maxAbs = (values: readonly number[]): number =>
	values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);

// A Levenberg-damped ascent step: solve (−H + μI) Δx = ∇, clamping d back to its ≥ 0 boundary.
function ascentStep({
	base,
	grad,
	mu,
	x,
	drawIndex,
}: {
	base: number[][];
	grad: number[];
	mu: number;
	x: readonly number[];
	drawIndex: number;
}): number[] {
	const damped = base.map((row, i) => row.map((value, j) => -value + (i === j ? mu : 0)));
	const delta = solve(damped, grad);
	const candidate = x.map((value, i) => value + delta[i]);
	candidate[drawIndex] = Math.max(candidate[drawIndex], 1e-6);
	return candidate;
}

// Damped Newton ascent. The log-likelihood is concave in this parametrisation, so −H is (near)
// positive definite; the damping μ only earns its keep on the first steps and at the d ≥ 0
// boundary. Returns the Hessian at the optimum for the caller's covariance.
export function maximize({
	objective,
	drawIndex,
	maxIterations = 100,
	tolerance = 1e-8,
}: {
	objective: Objective;
	drawIndex: number;
	maxIterations?: number;
	tolerance?: number;
}): { x: number[]; hessian: number[][]; iterations: number; converged: boolean } {
	let x = Array.from({ length: objective.size }, () => 0);
	x[drawIndex] = 0.5;
	let mu = 1e-3;

	for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
		const { ll, grad } = objective.evaluate(x);
		if (maxAbs(grad) < tolerance) {
			return { x, hessian: hessian(objective, x), iterations: iteration, converged: true };
		}

		const base = hessian(objective, x);
		for (let attempt = 0; attempt < 30; attempt += 1) {
			const candidate = ascentStep({ base, grad, mu, x, drawIndex });
			if (objective.evaluate(candidate).ll >= ll) {
				x = candidate;
				mu = Math.max(mu * 0.5, 1e-9);
				break;
			}
			mu *= 4;
		}
	}

	return { x, hessian: hessian(objective, x), iterations: maxIterations, converged: false };
}
