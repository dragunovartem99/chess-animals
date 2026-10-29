import type { BotDefinition } from "../bots";
import type { PairOutcome } from "./adaptiveRating";
import { DEFAULT_ADJUDICATION } from "./adjudicate";
import { botCost } from "./cost";
import { pairKey } from "./pairing";
import { mixSeed } from "./seed";
import type { GameReport, GameSpec } from "./types";

export type TournamentOpening = { id: string; fen: string };
export type TaggedSpec = { spec: GameSpec; aIsWhite: boolean };
export type SpecContext = {
	definition: Map<string, BotDefinition>;
	openings: readonly TournamentOpening[];
	seed: number;
	plyLimit: number;
	// How many openings a single pair-visit plays. A pair the arena keeps coming back to still
	// works through the whole set — each revisit walks the window forward — but a pair it visits
	// once pays for this many games, not all ~50.
	openingsPerVisit: number;
};

// The dearest side sets a pair's cost; `visitWindow` shrinks the opening window by it, so the
// pairs that dominate wall time play a fraction of the set per visit and are revisited more.
function pairWeight(a: string, b: string, context: SpecContext): number {
	return Math.max(botCost(context.definition.get(a)!), botCost(context.definition.get(b)!));
}

// A seeded per-pair offset, so pairs sample different lines, advancing one window per revisit. An
// expensive pair plays a fraction of it and is revisited more.
function visitWindow(
	a: string,
	b: string,
	replay: number,
	context: SpecContext
): TournamentOpening[] {
	const { openings, openingsPerVisit, seed } = context;
	const span = Math.max(2, Math.round(openingsPerVisit / pairWeight(a, b, context)));
	const capped = Math.min(span, openings.length);
	const start = (mixSeed([seed, pairKey(a, b)]) + replay * capped) % openings.length;
	return Array.from({ length: capped }, (_, i) => openings[(start + i) % openings.length]);
}

// Both colors of every opening in this visit's window, for one pair.
export function pairSpecs(
	a: string,
	b: string,
	replay: number,
	context: SpecContext
): TaggedSpec[] {
	const key = pairKey(a, b);
	return visitWindow(a, b, replay, context).flatMap((opening) =>
		(
			[
				[a, b, true],
				[b, a, false],
			] as const
		).map(([white, black, aIsWhite]) => ({
			aIsWhite,
			spec: {
				white: context.definition.get(white)!,
				black: context.definition.get(black)!,
				openingFen: opening.fen,
				openingId: opening.id,
				seed: mixSeed([context.seed, key, opening.id, replay, white]),
				plyLimit: context.plyLimit,
				// Explicit on the spec, not left to `runGame`'s default, so the result-cache key
				// reflects it — retuning the resign rule then invalidates exactly the games it changes.
				adjudication: DEFAULT_ADJUDICATION,
			},
		}))
	);
}

// Roll one pair's game reports up into the white-split counts the fit needs.
export function tally(entries: TaggedSpec[], reports: GameReport[]): PairOutcome {
	const outcome: PairOutcome = {
		aWhite: { whiteWins: 0, blackWins: 0, draws: 0 },
		bWhite: { whiteWins: 0, blackWins: 0, draws: 0 },
	};
	entries.forEach(({ aIsWhite }, i) => {
		const bucket = aIsWhite ? outcome.aWhite : outcome.bWhite;
		const { result } = reports[i];
		if (result === "white") bucket.whiteWins += 1;
		else if (result === "black") bucket.blackWins += 1;
		else bucket.draws += 1;
	});
	return outcome;
}
