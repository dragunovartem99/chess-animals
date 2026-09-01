import type { BotDefinition } from "../bots";
import type { RatingResult } from "../rating";
import { type PairOutcome, runAdaptiveRating } from "./adaptiveRating";
import { crossTable, type CrossTable } from "./crossTable";
import { runGames } from "./pool";
import { standingOrder } from "./settled";
import { pairKeyOf, pairSpecs, type TournamentOpening, tally } from "./tournamentSpecs";
import type { GameReport, GameSpec } from "./types";

export type { TournamentOpening };
export type TournamentBot = { id: string; definition: BotDefinition };
export type TournamentResult = {
	rating: RatingResult;
	crossTable: CrossTable;
	games: number;
	rounds: number;
};

// The arena, top to bottom: adaptive pairing over the pool, then the head-to-head grid built from
// the games it actually played. `run` is injectable — the CLI wraps it with the result cache; a
// test passes a synthetic one.
export async function runTournament({
	bots,
	openings,
	seed = 1,
	plyLimit = 160,
	targetStderr = 40,
	run = (specs) => runGames({ specs }),
}: {
	bots: readonly TournamentBot[];
	openings: readonly TournamentOpening[];
	seed?: number;
	plyLimit?: number;
	targetStderr?: number;
	run?: (specs: GameSpec[]) => Promise<GameReport[]>;
}): Promise<TournamentResult> {
	const context = {
		definition: new Map(bots.map((bot) => [bot.id, bot.definition])),
		openings,
		seed,
		plyLimit,
	};
	const replays = new Map<string, number>();

	const playPair = async (a: string, b: string): Promise<PairOutcome> => {
		const replay = replays.get(pairKeyOf(a, b)) ?? 0;
		replays.set(pairKeyOf(a, b), replay + 1);
		const entries = pairSpecs(a, b, replay, context);
		return tally(entries, await run(entries.map((entry) => entry.spec)));
	};

	const { rating, rounds, games, matchups } = await runAdaptiveRating({
		ids: bots.map((bot) => bot.id),
		playPair,
		targetStderr,
	});

	return {
		rating,
		crossTable: crossTable({ ids: standingOrder(rating.players), matchups }),
		games,
		rounds,
	};
}
