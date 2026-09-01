import type { BotDefinition } from "../bots";
import type { PairOutcome } from "./adaptiveRating";
import type { GameReport, GameSpec } from "./types";

export type TournamentOpening = { id: string; fen: string };
export type TaggedSpec = { spec: GameSpec; aIsWhite: boolean };
export type SpecContext = {
	definition: Map<string, BotDefinition>;
	openings: readonly TournamentOpening[];
	seed: number;
	plyLimit: number;
};

export const pairKeyOf = (a: string, b: string): string => (a < b ? `${a}::${b}` : `${b}::${a}`);

// A stable 32-bit mix — enough to give every (pair, opening, replay, colour) its own game seed,
// so replaying a pair in a later round adds fresh games and re-running the whole tournament from
// the same master seed reproduces every one of them.
function mixSeed(parts: (string | number)[]): number {
	let hash = 2166136261;
	for (const character of parts.join("|")) {
		hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619) >>> 0;
	}
	return hash >>> 0;
}

// Both colours of every opening for one pair, on this replay of it.
export function pairSpecs(
	a: string,
	b: string,
	replay: number,
	context: SpecContext
): TaggedSpec[] {
	const key = pairKeyOf(a, b);
	return context.openings.flatMap((opening) =>
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
