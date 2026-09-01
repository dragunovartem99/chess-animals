import type { Matchup } from "./types";

export const ELO_PER_LOG = 400 / Math.LN10;

const EPS = 1e-12;

export function sigmoid(x: number): number {
	return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
}

function clamp(value: number, low: number, high: number): number {
	return Math.min(high, Math.max(low, value));
}

type Term = { whiteIndex: number; blackIndex: number; wins: number; losses: number; draws: number };

export type Objective = {
	// Length of the parameter vector: one log-strength per player, then white advantage `h` and
	// the log draw parameter `d`.
	size: number;
	playerCount: number;
	// Log-likelihood and its gradient at `x`, including the Gaussian prior on the strengths.
	evaluate: (x: readonly number[]) => { ll: number; grad: number[] };
};

// One term's log-likelihood and its derivatives with respect to Δ = β_white + h − β_black and to
// d = log ν. Rao–Kupper collapses to a logistic here: P(white win) = σ(Δ − d), P(black win) =
// σ(−Δ − d), and the draw probability is the remainder — non-negative exactly when d ≥ 0.
function termDerivatives({ term, delta, d }: { term: Term; delta: number; d: number }): {
	ll: number;
	dDelta: number;
	dD: number;
} {
	const { wins, losses, draws } = term;
	const s1 = clamp(sigmoid(delta - d), EPS, 1 - EPS);
	const s2 = clamp(sigmoid(-delta - d), EPS, 1 - EPS);
	const pDraw = clamp(1 - s1 - s2, EPS, 1);
	const g1 = s1 * (1 - s1);
	const g2 = s2 * (1 - s2);

	return {
		ll: wins * Math.log(s1) + losses * Math.log(s2) + draws * Math.log(pDraw),
		dDelta: wins * (1 - s1) - losses * (1 - s2) - (draws * (g1 - g2)) / pDraw,
		dD: -wins * (1 - s1) - losses * (1 - s2) + (draws * (g1 + g2)) / pDraw,
	};
}

// Bradley–Terry with a multiplicative white advantage and a Rao–Kupper draw parameter, plus a
// weak Gaussian prior on the strengths. Written in log space so the fit is a plain concave
// maximisation.
export function buildObjective({
	matchups,
	ids,
	priorPrecision,
}: {
	matchups: readonly Matchup[];
	ids: readonly string[];
	priorPrecision: number;
}): Objective {
	const index = new Map(ids.map((id, position) => [id, position]));
	const n = ids.length;
	const terms: Term[] = matchups.map((matchup) => ({
		whiteIndex: index.get(matchup.white)!,
		blackIndex: index.get(matchup.black)!,
		wins: matchup.whiteWins,
		losses: matchup.blackWins,
		draws: matchup.draws,
	}));

	return {
		size: n + 2,
		playerCount: n,
		evaluate(x) {
			const h = x[n];
			const d = x[n + 1];
			const grad = Array.from({ length: n + 2 }, () => 0);
			let ll = 0;

			for (const term of terms) {
				const delta = x[term.whiteIndex] + h - x[term.blackIndex];
				const { ll: termLl, dDelta, dD } = termDerivatives({ term, delta, d });
				ll += termLl;
				grad[term.whiteIndex] += dDelta;
				grad[term.blackIndex] -= dDelta;
				grad[n] += dDelta;
				grad[n + 1] += dD;
			}

			for (let i = 0; i < n; i += 1) {
				ll -= 0.5 * priorPrecision * x[i] * x[i];
				grad[i] -= priorPrecision * x[i];
			}

			return { ll, grad };
		},
	};
}
