import { invert } from "./linalg";
import { buildObjective, ELO_PER_LOG } from "./model";
import { maximize } from "./newton";
import type { Matchup, RatingOptions, RatingResult } from "./types";

function playerIds(matchups: readonly Matchup[]): string[] {
	const ids: string[] = [];
	const seen = new Set<string>();
	for (const { white, black } of matchups) {
		for (const id of [white, black]) {
			if (seen.has(id)) continue;
			seen.add(id);
			ids.push(id);
		}
	}
	return ids;
}

// Bradley–Terry maximum likelihood with a white-advantage term, a Rao–Kupper draw parameter and
// a weak Gaussian prior on the strengths. Order-independent and stable under imbalanced pair
// counts — the two properties the paper's Elo runs lacked — and the prior keeps an undefeated
// player finite instead of diverging. Standard errors come from the inverse Fisher information
// (the negative Hessian at the optimum).
export function fitBradleyTerry({
	matchups,
	options = {},
}: {
	matchups: readonly Matchup[];
	options?: RatingOptions;
}): RatingResult {
	if (matchups.length === 0) throw new Error("no matchups to rate");

	const ids = playerIds(matchups);
	const anchor = options.anchor ?? 1500;
	const objective = buildObjective({
		matchups,
		ids,
		priorPrecision: options.priorPrecision ?? 0.25,
	});

	const { x, hessian, iterations, converged } = maximize({
		objective,
		drawIndex: objective.size - 1,
	});

	const covariance = invert(hessian.map((row) => row.map((value) => -value)));
	const players = ids.map((id, i) => ({
		id,
		rating: anchor + ELO_PER_LOG * x[i],
		stderr: ELO_PER_LOG * Math.sqrt(Math.max(covariance[i][i], 0)),
	}));

	return {
		players,
		whiteAdvantage: ELO_PER_LOG * x[objective.playerCount],
		drawParam: Math.exp(x[objective.playerCount + 1]),
		iterations,
		converged,
	};
}
