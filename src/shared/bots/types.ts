import type { SearchOptions } from "../engine";
import type { WeightVector } from "../eval";
import type { BaseName } from "./bases";

// What makes a bot a sea animal: Stockfish alone, softened. Each move Stockfish weighs its best
// `lines` candidates on `nodes` nodes, and the animal picks one at random, a candidate `d`
// centipawns worse than the best weighted `exp(-d / temperature)`. A slip that costs little is
// common and a blunder rare, which is how people err — a uniformly random move hangs a queen out
// of the blue. `nodes` is how far it sees, `lines` how many moves it considers, `temperature` how
// carelessly it chooses among them; zero plays the best line every time.
export type StockfishOptions = { nodes: number; lines: number; temperature: number };

// What a bot is on disk and on the wire: plain JSON-shaped data, so a tuned bot can be exported,
// pasted into a file, sent to a worker, or hashed into a cache key without any of them needing to
// know what a feature vector is.
//
// Weights are keyed by feature name rather than positional, so appending a feature to the
// registry cannot silently reinterpret every bot ever saved.
export type BotDefinition = {
	id: string;
	// Unread by a sea animal, which never searches itself.
	search: SearchOptions;
	// Present for a sea animal, whose moves all come from Stockfish.
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
