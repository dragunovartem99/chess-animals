import type { SearchOptions } from "../engine";
import type { WeightVector } from "../eval";

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
	// Everything the bot is, keyed by feature name. Anything not named is zero.
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
