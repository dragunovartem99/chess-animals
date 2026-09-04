import type { BotDefinition } from "../bots";
import type { GameReport, GameSpec } from "../scheduler";
import { fromVector, type TuneSpec } from "./parameters";

export type GauntletBot = { id: string; definition: BotDefinition };
export type GauntletOpening = { id: string; fen: string };

type Game = {
	opponent: BotDefinition;
	opening: GauntletOpening;
	candidateWhite: boolean;
	seed: number;
};

function seedFrom(parts: (string | number)[]): number {
	let hash = 2166136261;
	for (const character of parts.join("|")) {
		hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619) >>> 0;
	}
	return hash >>> 0;
}

function enumerate(
	opponents: readonly GauntletBot[],
	openings: readonly GauntletOpening[],
	seed: number
): Game[] {
	return opponents.flatMap((opponent) =>
		openings.flatMap((opening) =>
			([true, false] as const).map((candidateWhite) => ({
				opponent: opponent.definition,
				opening,
				candidateWhite,
				seed: seedFrom([seed, opponent.id, opening.id, candidateWhite ? "w" : "b"]),
			}))
		)
	);
}

// Mean points per game from the candidate's side: a win is 1, a draw ½.
function meanPoints(games: readonly Game[], reports: readonly GameReport[]): number {
	const points = reports.reduce((sum, report, i) => {
		const candidateColor = games[i].candidateWhite ? "white" : "black";
		if (report.result === candidateColor) return sum + 1;
		return report.result === null ? sum + 0.5 : sum;
	}, 0);
	return points / games.length;
}

// A fixed set of games — every opponent, every opening, both colors — with the seeds pinned up
// front. The candidate's weights are the only thing that changes between calls, so two probes
// differ only by the perturbation and not by which games they drew: the common random numbers
// SPSA needs for a usable signal.
export function createGauntlet({
	candidate,
	spec,
	opponents,
	openings,
	seed = 1,
	plyLimit = 160,
	run,
}: {
	candidate: BotDefinition;
	spec: TuneSpec;
	opponents: readonly GauntletBot[];
	openings: readonly GauntletOpening[];
	seed?: number;
	plyLimit?: number;
	run: (specs: GameSpec[]) => Promise<GameReport[]>;
}): { evaluate: (theta: readonly number[]) => Promise<number>; gameCount: number } {
	const games = enumerate(opponents, openings, seed);

	async function evaluate(theta: readonly number[]): Promise<number> {
		const tuned: BotDefinition = {
			...candidate,
			weights: fromVector(candidate.weights, spec, theta),
		};
		const specs: GameSpec[] = games.map((game) => ({
			white: game.candidateWhite ? tuned : game.opponent,
			black: game.candidateWhite ? game.opponent : tuned,
			openingFen: game.opening.fen,
			openingId: game.opening.id,
			seed: game.seed,
			plyLimit,
		}));
		return meanPoints(games, await run(specs));
	}

	return { evaluate, gameCount: games.length };
}
