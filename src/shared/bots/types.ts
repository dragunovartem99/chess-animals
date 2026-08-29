import type { SearchOptions } from "../engine";
import type { PhaseWeights } from "../eval";

export type Phase = "opening" | "middlegame" | "endgame";

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
	// A phase may be omitted, in which case it inherits from the middlegame — most animals have
	// one idea and play it throughout, and writing that idea three times invites drift.
	weights: Partial<Record<Phase, Record<string, number>>> & {
		middlegame: Record<string, number>;
	};
};

// The same bot with its weights resolved into vectors, ready for the search. Built by
// `compileBot`, never written by hand.
export type BotConfig = {
	id: string;
	search: SearchOptions;
	temperature: number;
	weights: PhaseWeights;
};
