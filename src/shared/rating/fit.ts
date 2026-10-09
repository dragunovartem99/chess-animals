import { centeredDiagonal, invert } from "./linalg";
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

// Bradley–Terry MLE with a white-advantage term, Rao–Kupper draws and a weak Gaussian prior that
// keeps an unbeaten player finite. Standard errors from the inverse Fisher information.
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
	const variance = centeredDiagonal(covariance, ids.length);
	const players = ids.map((id, i) => ({
		id,
		rating: anchor + ELO_PER_LOG * x[i],
		stderr: ELO_PER_LOG * Math.sqrt(Math.max(variance[i], 0)),
	}));

	return {
		players,
		whiteAdvantage: ELO_PER_LOG * x[objective.playerCount],
		drawParam: Math.exp(x[objective.playerCount + 1]),
		iterations,
		converged,
	};
}
