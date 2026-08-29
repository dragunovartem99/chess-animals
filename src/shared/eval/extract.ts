import type { Chess } from "chessops/chess";
import type { Move } from "chessops/types";

import { FEATURES_BY_KEY } from "./features";
import { createFeatureVector, type FeatureVector } from "./vector";

const TEMPO = FEATURES_BY_KEY.get("tempo")!.id;

// Every feature a bot is scored on, read off one position in a single pass, always from the
// perspective of the side to move — so no evaluation code is ever colour-specific and a bot
// plays the same way with either colour.
//
// `move` is the move that produced `position`, needed by the move-level family (a capture, a
// check, a promotion); at the root of a search there is none.
export function extractFeatures(_options: { position: Chess; move?: Move }): FeatureVector {
	const features = createFeatureVector();

	features[TEMPO] = 1;

	return features;
}
