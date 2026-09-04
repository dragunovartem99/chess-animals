import type { SearchOptions } from "../engine";
import type { WeightVector } from "../eval";
import type { BaseName } from "./bases";

// What a bot is on disk and on the wire: plain JSON-shaped data, so a tuned bot can be exported,
// pasted into a file, sent to a worker, or hashed into a cache key without any of them needing to
// know what a feature vector is.
//
// Weights are keyed by feature name rather than positional, so appending a feature to the
// registry cannot silently reinterpret every bot ever saved.
export type BotDefinition = {
	id: string;
	search: SearchOptions;
	// How many points of evaluation the bot will throw away when picking a move. Zero is a strict
	// argmax; the paper's weighted-sampling players live above it.
	temperature: number;
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
	temperature: number;
	weights: WeightVector;
};
