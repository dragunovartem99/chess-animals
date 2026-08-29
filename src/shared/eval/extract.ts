import type { Chess } from "chessops/chess";

import { extractAggression } from "./families/aggression";
import { createContext } from "./families/context";
import { extractControl } from "./families/control";
import { extractKing } from "./families/king";
import { extractMaterial } from "./families/material";
import { extractMobility } from "./families/mobility";
import { extractMoveFeatures, type PlayedMove } from "./families/move";
import { extractPawns } from "./families/pawns";
import { extractPieces } from "./families/pieces";
import { extractPlacement } from "./families/placement";
import { extractProximity } from "./families/proximity";
import { extractSymmetry } from "./families/symmetry";
import { featureId } from "./features";
import { createFeatureVector, type FeatureVector } from "./vector";

const TEMPO = featureId("tempo");

// Every feature a bot is scored on, read off one position, always from the perspective of the
// side to move — so no evaluation code is ever colour-specific and a bot plays the same way with
// either colour.
//
// `played` is the move that produced `position` and the position it came from, which the
// move-level family needs. At the root of a search there is none, and those features read zero.
export function extractFeatures({
	position,
	played,
}: {
	position: Chess;
	played?: PlayedMove;
}): FeatureVector {
	const features = createFeatureVector();
	const context = createContext(position);

	features[TEMPO] = 1;
	extractMaterial({ context, features });
	extractPlacement({ context, features });
	extractPieces({ context, features });
	extractPawns({ context, features });
	extractKing({ context, features });
	extractMobility({ context, features });
	extractControl({ context, features });
	extractProximity({ context, features });
	extractSymmetry({ context, features });
	extractAggression({ context, features });
	extractMoveFeatures({ position, played, features });

	return features;
}
