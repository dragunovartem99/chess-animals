import type { Color } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { centrality } from "./placement";

const KING_ACTIVITY = featureId("kingActivity");

export const SLOTS = [KING_ACTIVITY];

function kingCentrality({ context, color }: { context: EvalContext; color: Color }): number {
	let total = 0;
	for (const square of context.position.board.pieces(color, "king")) total += centrality(square);

	return total;
}

// Endgame principles. Each value is scaled by `1 - phase` here, inside the extractor, so it is
// silent while the pieces are on and full-strength with bare kings and pawns. That is per-feature
// shaping of a value, like `swarm` being negated on the way out — not a second weight vector, which
// is what METHOD.md's "One vector, not three" removed.
export function extractEndgame({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const late = 1 - context.phase;
	// The vector arrives zeroed, and a middlegame is most of what a search sees.
	if (late === 0) return;

	// `centralization` leaves the king out because in a middlegame he wants shelter; once the
	// material is off he is a fighting piece and wants the centre — hence the phase gate.
	features[KING_ACTIVITY] =
		(kingCentrality({ context, color: context.us }) -
			kingCentrality({ context, color: context.them })) *
		late;
}
