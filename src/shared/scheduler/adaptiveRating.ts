import { fitBradleyTerry } from "../rating";
import type { Matchup, RatingResult } from "../rating";
import { foldRound, type PairOutcome } from "./fold";
import { decisivenessOf, nextPairings, type Pair, seedPairs, type Standing } from "./pairing";
import { ratingsSettled, standingOrder } from "./settled";

export type { PairOutcome } from "./fold";

type Round = { round: number; standings: Standing[]; games: number };

// A sparse first-round graph is enough to connect the fit. A rung wider than `separationZ`
// combined SEs is confidently ordered; one tighter than `tieZ` is a coin flip not worth chasing;
// only the band between the two earns more games. Fixed, not knobs — the arena has none.
const SEED_DEGREE = 4;
const BANDS = { separationZ: 1.5, tieZ: 0.5 };

type RatingRun = {
	playPair: (a: string, b: string) => Promise<PairOutcome>;
	batchSize: number;
	maxRounds: number;
	stableRounds: number;
	onRound?: (round: Round) => void;
	matchups: Map<string, Matchup>;
	playCounts: Map<string, number>;
	orderHistory: string[][];
	games: number;
};

// Recursive rather than a `for` with an `await` inside: a round's pairings come from the fit of
// every round before it, so rounds are sequential by nature — only the games within one round
// run in parallel.
async function playRound({
	run,
	round,
	pairs,
}: {
	run: RatingRun;
	round: number;
	pairs: Pair[];
}): Promise<{ rating: RatingResult; rounds: number }> {
	const { matchups, playCounts, orderHistory, stableRounds, batchSize } = run;
	const outcomes = await Promise.all(pairs.map(({ a, b }) => run.playPair(a, b)));
	run.games += foldRound({ matchups, playCounts, pairs, outcomes });

	const rating = fitBradleyTerry({ matchups: [...matchups.values()] });
	const standings = rating.players;
	orderHistory.push(standingOrder(standings));
	run.onRound?.({ round, standings, games: run.games });

	const settled = ratingsSettled({ standings, ...BANDS, orderHistory, stableRounds });
	if (settled || round + 1 >= run.maxRounds) return { rating, rounds: round + 1 };
	const decisiveness = decisivenessOf(matchups.values());
	const next = nextPairings({ standings, playCounts, batchSize, decisiveness });
	return playRound({ run, round: round + 1, pairs: next });
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
	// The stable order is what ends every real run — the rung bands never fire first on this
	// roster — so each extra round here is pure cost. Over seeds 1–3, two cut 23% of the games
	// (and 40% off the worst seed) and moved the ratings no more than a change of seed does.
	stableRounds = 2,
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

	const run: RatingRun = {
		playPair,
		batchSize,
		maxRounds,
		stableRounds,
		onRound,
		matchups: new Map(),
		playCounts: new Map(),
		orderHistory: [],
		games: 0,
	};
	const pairs = seedPairs({ ids, degree: SEED_DEGREE });
	const { rating, rounds } = await playRound({ run, round: 0, pairs });
	return { rating, rounds, games: run.games, matchups: [...run.matchups.values()] };
}
