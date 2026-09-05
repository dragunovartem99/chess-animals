import type { Chess } from "chessops/chess";

import { extractAggression, SLOTS as AGGRESSION } from "./families/aggression";
import { createContext } from "./families/context";
import { extractControl, SLOTS as CONTROL } from "./families/control";
import { extractKing, SLOTS as KING } from "./families/king";
import { extractMaterial, SLOTS as MATERIAL } from "./families/material";
import { extractMobility, SLOTS as MOBILITY } from "./families/mobility";
import { extractMoveFeatures, SLOTS as MOVE, type PlayedMove } from "./families/move";
import { extractPlacement, SLOTS as PLACEMENT } from "./families/placement";
import { extractProximity, SLOTS as PROXIMITY } from "./families/proximity";
import { extractSymmetry, SLOTS as SYMMETRY } from "./families/symmetry";
import { createFeatureVector, type FeatureVector } from "./vector";

// Every family that reads the board, with the vector slots it writes. The slots are declared
// beside the extractor rather than here, so the two cannot drift; `reachable.test.ts` holds every
// feature in the registry to being claimed by exactly one family.
const BOARD_FAMILIES = [
	{ slots: MATERIAL, run: extractMaterial },
	{ slots: PLACEMENT, run: extractPlacement },
	{ slots: KING, run: extractKing },
	{ slots: MOBILITY, run: extractMobility },
	{ slots: CONTROL, run: extractControl },
	{ slots: PROXIMITY, run: extractProximity },
	{ slots: SYMMETRY, run: extractSymmetry },
	{ slots: AGGRESSION, run: extractAggression },
] as const;

// `played` is the move that produced `position` and the position it came from, which the
// move-level family needs. At the root of a search there is none, and those features read zero.
//
// A caller that discards the vector as soon as it has dotted it passes `into` to reuse a buffer
// rather than allocating a fresh one every call. It is zeroed here; every other caller keeps the
// fresh-array default so two extractions never alias.
export type ExtractFrame = { position: Chess; played?: PlayedMove; into?: FeatureVector };

export type Extractor = (frame: ExtractFrame) => FeatureVector;

// Every feature a bot could be scored on, read off one position, always from the **side to
// move's** perspective — so no evaluation code is ever color-specific and a bot plays the same
// way with either color.
//
// `createContext` walks the board once and hands each family the piece list with its attack sets
// already computed; the families then do index and bitboard arithmetic only.
//
// The families are called one after another by name rather than through `BOARD_FAMILIES`, which
// reads worse and is deliberate: a loop over the table is one call site with ten targets, and it
// measured three times slower than ten call sites with one target each. A search uses
// `createExtractor`, which runs few enough families for that not to matter; this is the path that
// runs all eight, so it pays for none of the indirection.
export function extractFeatures({ position, played, into }: ExtractFrame): FeatureVector {
	const features = into ?? createFeatureVector();
	if (into) into.fill(0);

	const context = createContext({ position });

	extractMaterial({ context, features });
	extractPlacement({ context, features });
	extractKing({ context, features });
	extractMobility({ context, features });
	extractControl({ context, features });
	extractProximity({ context, features });
	extractSymmetry({ context, features });
	extractAggression({ context, features });
	extractMoveFeatures({ position, played, features });

	return features;
}

// The features **this** bot is scored on, and no others.
//
// A weight of zero cannot change a score, so the family behind it need never run. That is not a
// micro-optimisation: an animal names a handful of the two dozen-odd features, and reading all of
// them cost about 25 µs a node whoever was playing. The Elephant pays for material and its one
// idea and skips the rest, the Goat skips the board entirely, and the random mover extracts
// nothing at all.
//
// `slots` is fixed for the life of a search, which is why this is built once per `go` rather than
// consulted per node.
export function createExtractor({ slots }: { slots: Iterable<number> }): Extractor {
	const live = new Set(slots);
	const weighs = (slot: number) => live.has(slot);
	const weighsAny = (candidates: readonly number[]) => candidates.some((slot) => weighs(slot));

	const families = BOARD_FAMILIES.filter((family) => weighsAny(family.slots));
	const move = weighsAny(MOVE);

	return function extract({ position, played, into }): FeatureVector {
		const features = into ?? createFeatureVector();
		if (into) into.fill(0);

		// The context is a walk of the whole board, so it is not built at all for a bot that
		// weighs nothing on it — `cccp` reads only the move that was played.
		if (families.length > 0) {
			const context = createContext({ position, weighs });
			for (const family of families) family.run({ context, features });
		}

		if (move) extractMoveFeatures({ position, played, features });

		return features;
	};
}
