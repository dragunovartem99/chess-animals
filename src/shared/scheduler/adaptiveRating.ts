import { fitBradleyTerry } from "../rating";
import type { Matchup, RatingResult } from "../rating";
import {
	decisivenessOf,
	nextPairings,
	type Pair,
	pairKey,
	seedPairs,
	type Standing,
} from "./pairing";
import { ratingsSettled, standingOrder } from "./settled";

export type PairCounts = { whiteWins: number; blackWins: number; draws: number };
// One mini-match between two bots: the counts with `a` on white and, separately, with `b` on
// white. Color is kept split so the fit can still estimate the white advantage.
export type PairOutcome = { aWhite: PairCounts; bWhite: PairCounts };

type Round = { round: number; standings: Standing[]; games: number };

// A sparse first-round graph is enough to connect the fit. A rung wider than `separationZ`
// combined SEs is confidently ordered; one tighter than `tieZ` is a coin flip not worth chasing;
// only the band between the two earns more games. Fixed, not knobs — the arena has none.
const SEED_DEGREE = 4;
const BANDS = { separationZ: 1.5, tieZ: 0.5 };

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
// added. Split out of the loop so the closure is not rebuilt each iteration.
function foldRound({
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

// The arena's outer loop: seed with a sparse comparison graph so the fit is connected, then each
// round refit and spend the next batch of games on the pairs that can still move the table. Stops
// once every adjacent rung is separated or the order has held for `stableRounds`.
export async function runAdaptiveRating({
	ids,
	playPair,
	// Half the field per round, capped: enough of the informative pairs to make progress, few
	// enough that the stop condition is re-checked before the run overshoots it.
	batchSize = Math.min(ids.length, Math.max(8, Math.round(ids.length / 2))),
	maxRounds = 40,
	stableRounds = 3,
	onRound,
}: {
	ids: readonly string[];
	playPair: (a: string, b: string) => Promise<PairOutcome>;
	batchSize?: number;
	maxRounds?: number;
	stableRounds?: number;
	onRound?: (round: Round) => void;
}): Promise<{ rating: RatingResult; rounds: number; games: number; matchups: Matchup[] }> {
	if (ids.length < 2) throw new Error("need at least two bots to rate");

	const matchups = new Map<string, Matchup>();
	const playCounts = new Map<string, number>();
	const orderHistory: string[][] = [];
	let pairs: Pair[] = seedPairs({ ids, degree: SEED_DEGREE });
	let games = 0;
	let rounds = 0;
	let rating!: RatingResult;

	for (let round = 0; round < maxRounds; round += 1) {
		rounds = round + 1;
		const outcomes = await Promise.all(pairs.map(({ a, b }) => playPair(a, b)));
		games += foldRound({ matchups, playCounts, pairs, outcomes });

		rating = fitBradleyTerry({ matchups: [...matchups.values()] });
		orderHistory.push(standingOrder(rating.players));
		onRound?.({ round, standings: rating.players, games });

		const standings = rating.players;
		if (ratingsSettled({ standings, ...BANDS, orderHistory, stableRounds })) break;
		pairs = nextPairings({
			standings,
			playCounts,
			batchSize,
			decisiveness: decisivenessOf(matchups.values()),
		});
	}

	return { rating, rounds, games, matchups: [...matchups.values()] };
}
