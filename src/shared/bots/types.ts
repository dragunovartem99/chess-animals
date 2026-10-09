import type { SearchOptions } from "../engine";
import type { WeightVector } from "../eval";
import type { BaseName } from "./bases";

// Stockfish weighs its best `lines` on `nodes` nodes; a line `d` cp worse is picked with weight
// `exp(-d / temperature)` — slips common, blunders rare, like people. Zero plays the best.
export type StockfishOptions = { nodes: number; lines: number; temperature: number };

// What makes a bot an underwater animal: Maia, a model of how people play at a rating. It plays
// a move people at `elo` would, drawn by how often they would — or, `greedy`, the one they play
// most, which is Maia at its strongest.
export type MaiaOptions = { elo: number; greedy?: boolean };

// Plain JSON, so a bot can be exported, posted to a worker or hashed into a cache key. Weights are
// keyed by feature name, so appending a feature never reinterprets a saved bot.
export type BotDefinition = {
	id: string;
	// Unread by a monster or an underwater animal, neither of which searches itself.
	search: SearchOptions;
	// Present for a monster, whose moves all come from Stockfish.
	stockfish?: StockfishOptions;
	// Present for an underwater animal, whose moves all come from Maia.
	maia?: MaiaOptions;
	// The starting point the weights are written over — piece values and mate-awareness, usually.
	// Omitted means `zero`: a bot that names no base is exactly what its weights say and nothing
	// else, which is what the paper's `random_move` needs.
	base?: BaseName;
	// The bot's own idea, keyed by feature name. Anything the base does not set and this does not
	// name is zero.
	weights: Record<string, number>;
};

// The same bot with its weights resolved into a vector, ready for the search. Built by
// `compileBot`, never written by hand.
export type BotConfig = {
	id: string;
	search: SearchOptions;
	stockfish?: StockfishOptions;
	maia?: MaiaOptions;
	weights: WeightVector;
};
