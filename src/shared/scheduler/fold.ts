import type { Matchup } from "../rating";
import { pairKey } from "./pairing";
import type { Pair } from "./pairing";

export type PairCounts = { whiteWins: number; blackWins: number; draws: number };
// One mini-match between two bots: the counts with `a` on white and, separately, with `b` on
// white. Color is kept split so the fit can still estimate the white advantage.
export type PairOutcome = { aWhite: PairCounts; bWhite: PairCounts };

function add(into: Map<string, Matchup>, white: string, black: string, counts: PairCounts): number {
	const key = `${white}>${black}`;
	const existing = into.get(key) ?? { white, black, whiteWins: 0, blackWins: 0, draws: 0 };
	existing.whiteWins += counts.whiteWins;
	existing.blackWins += counts.blackWins;
	existing.draws += counts.draws;
	into.set(key, existing);
	return counts.whiteWins + counts.blackWins + counts.draws;
}

// Folds one round's outcomes into the running matchup table and play counts, returning the games
// added. Kept apart from the round loop: it is plain bookkeeping, and the loop is the policy.
export function foldRound({
	matchups,
	playCounts,
	pairs,
	outcomes,
}: {
	matchups: Map<string, Matchup>;
	playCounts: Map<string, number>;
	pairs: readonly Pair[];
	outcomes: readonly PairOutcome[];
}): number {
	let games = 0;
	pairs.forEach(({ a, b }, i) => {
		games += add(matchups, a, b, outcomes[i].aWhite);
		games += add(matchups, b, a, outcomes[i].bWhite);
		const key = pairKey(a, b);
		playCounts.set(key, (playCounts.get(key) ?? 0) + 1);
	});
	return games;
}
