import type { Chess } from "chessops/chess";
import type { Move } from "chessops/types";

import { createContext } from "./families/context";
import { extractControl } from "./families/control";
import { extractMaterial } from "./families/material";
import { extractMobility } from "./families/mobility";
import { extractPieces } from "./families/pieces";
import { extractPlacement } from "./families/placement";
import { featureId } from "./features";
import { createFeatureVector, type FeatureVector } from "./vector";

const TEMPO = featureId("tempo");

// Every feature a bot is scored on, read off one position, always from the perspective of the
// side to move — so no evaluation code is ever colour-specific and a bot plays the same way with
// either colour.
//
// `move` is the move that produced `position`, which the move-level family needs (a capture, a
// check, a promotion); at the root of a search there is none.
export function extractFeatures(options: { position: Chess; move?: Move }): FeatureVector {
	const features = createFeatureVector();
	const context = createContext(options.position);

	features[TEMPO] = 1;
	extractMaterial({ context, features });
	extractPlacement({ context, features });
	extractPieces({ context, features });
	extractMobility({ context, features });
	extractControl({ context, features });

	return features;
}
