import type { BotDefinition } from "../bots";
import type { EndReason, GameResult } from "../chess";

// When to stop a game early. The ply cap is a chess-rule-free draw; the resign rule ends a game
// once one side is hopelessly ahead on material, which is what keeps two weak bots from grinding
// out a decided position for fifty more moves and burning a worker slot.
export type Adjudication = {
	// Resign once |white material − black material| in pawns reaches this…
	resignThreshold: number;
	// …and has stayed there for this many consecutive plies.
	patience: number;
};

// Everything one game needs, in plain cloneable data so it can be posted to a worker unchanged.
export type GameSpec = {
	white: BotDefinition;
	black: BotDefinition;
	openingFen: string;
	seed: number;
	plyLimit: number;
	adjudication?: Adjudication;
};

export type GameReason = EndReason | "resigned";

export type GameReport = {
	result: GameResult;
	reason: GameReason;
	plies: number;
};
