import type { SearchOptions } from "../engine";
import type { WeightVector } from "../eval";
import type { BaseName } from "./bases";

// What makes a bot a sea animal: Stockfish, diluted with the bot itself. Every move is rolled —
// `mix` percent of them the bot's own search plays, with its own weights, and the rest are
// Stockfish's, which sees as far as `nodes` nodes take it. The node budget sets how well the
// animal sees, the mix how often it plays what it believes in instead.
export type StockfishOptions = { nodes: number; mix: number };

// What a bot is on disk and on the wire: plain JSON-shaped data, so a tuned bot can be exported,
// pasted into a file, sent to a worker, or hashed into a cache key without any of them needing to
// know what a feature vector is.
//
// Weights are keyed by feature name rather than positional, so appending a feature to the
// registry cannot silently reinterpret every bot ever saved.
export type BotDefinition = {
	id: string;
	// For a sea animal, the search of the moves it plays itself.
	search: SearchOptions;
	// Present for a sea animal, whose other moves come from Stockfish.
	stockfish?: StockfishOptions;
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
	weights: WeightVector;
};
