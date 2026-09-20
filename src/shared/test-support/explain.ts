import type { Chess } from "chessops/chess";

import { explainPosition } from "../eval/breakdown";
import type { PlayedMove } from "../eval/played";
import type { WeightVector } from "../eval/vector";
import { extract } from "./wasm";

// The panel's own path: the features from wasm, then the breakdown over them.
export function explain({
	position,
	weights,
	played,
}: {
	position: Chess;
	weights: WeightVector;
	played?: PlayedMove;
}) {
	return explainPosition({ position, weights, features: extract({ position, played }) });
}
