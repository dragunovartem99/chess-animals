import type { BotDefinition } from "../bots";
import type { RatingResult } from "../rating";
import { runAdaptiveRating } from "./adaptiveRating";
import type { PairOutcome } from "./adaptiveRating";
import { crossTable } from "./crossTable";
import type { CrossTable } from "./crossTable";
import { pairKey } from "./pairing";
import { runGames } from "./pool";
import { standingOrder } from "./settled";
import { pairSpecs, tally } from "./tournamentSpecs";
import type { SpecContext, TournamentOpening } from "./tournamentSpecs";
import type { GameReport, GameSpec } from "./types";

export type { TournamentOpening };
export type TournamentBot = { id: string; definition: BotDefinition };
export type TournamentResult = {
	rating: RatingResult;
	crossTable: CrossTable;
	games: number;
	rounds: number;
};

// The `playPair` the adaptive loop calls: each visit plays a fresh opening window for the pair
// (tracked in `replays`), reports its game count to `onProgress` as it lands, and rolls the
// results up into the white-split counts the fit needs.
function pairPlayer({
	context,
	run,
	onProgress,
}: {
	context: SpecContext;
	run: (specs: GameSpec[]) => Promise<GameReport[]>;
	onProgress?: (gamesSoFar: number) => void;
}): (a: string, b: string) => Promise<PairOutcome> {
	const replays = new Map<string, number>();
	let played = 0;

	return async (a, b) => {
		const key = pairKey(a, b);
		const replay = replays.get(key) ?? 0;
		replays.set(key, replay + 1);
		const entries = pairSpecs(a, b, replay, context);
		const reports = await run(entries.map((entry) => entry.spec));
		played += reports.length;
		onProgress?.(played);
		return tally(entries, reports);
	};
}

// The arena, top to bottom: adaptive pairing over the pool, then the head-to-head grid built from
// the games it actually played. `run` is injectable — the CLI wraps it with the result cache; a
// test passes a synthetic one.
export async function runTournament({
	bots,
	openings,
	seed = 1,
	// Only games that reach the cap pay for it, and the no-progress rule ends most level games
	// well before here; 120 trims the drawish tail the rule doesn't catch.
	plyLimit = 120,
	openingsPerVisit = 8,
	run = (specs) => runGames({ specs }),
	onRound,
	onProgress,
}: {
	bots: readonly TournamentBot[];
	openings: readonly TournamentOpening[];
	seed?: number;
	plyLimit?: number;
	openingsPerVisit?: number;
	run?: (specs: GameSpec[]) => Promise<GameReport[]>;
	onRound?: (progress: { round: number; games: number }) => void;
	// Fires mid-round as each pair's games land — the seeding round alone is a long slow silence.
	onProgress?: (gamesSoFar: number) => void;
}): Promise<TournamentResult> {
	const context: SpecContext = {
		definition: new Map(bots.map((bot) => [bot.id, bot.definition])),
		openings,
		seed,
		plyLimit,
		openingsPerVisit,
	};

	const { rating, rounds, games, matchups } = await runAdaptiveRating({
		ids: bots.map((bot) => bot.id),
		playPair: pairPlayer({ context, run, onProgress }),
		onRound: onRound && ((r) => onRound({ round: r.round, games: r.games })),
	});

	return {
		rating,
		crossTable: crossTable({ ids: standingOrder(rating.players), matchups }),
		games,
		rounds,
	};
}
