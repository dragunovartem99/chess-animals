import type { Chess } from "chessops/chess";

import { gamePhase } from "@/shared/chess";
import {
	extractFeatures,
	type FeatureFamily,
	FEATURES,
	interpolateWeights,
	type PhaseWeights,
} from "@/shared/eval";

export type Contribution = {
	key: string;
	i18nKey: string;
	family: FeatureFamily;
	// What the position reads for this feature, before any weight is applied.
	value: number;
	// The weight after the three phase sets have been blended for this position.
	weight: number;
	// Their product: what this feature is actually worth here.
	points: number;
};

export type Breakdown = { total: number; phase: number; rows: Contribution[] };

// Why a bot likes a position, term by term. The rows sum to exactly the number the search would
// score this position at, which is what makes this a debugging tool rather than an illustration:
// if the bot plays a move this panel cannot explain, the panel is wrong, not the bot.
//
// Move-level features read zero here — nothing has been played *to* reach the position being
// looked at — and features whose weight is zero are left out, since a roster of animals switches
// most of them off.
export function explainPosition({
	position,
	weights,
}: {
	position: Chess;
	weights: PhaseWeights;
}): Breakdown {
	const phase = gamePhase(position);
	const blended = interpolateWeights({ weights, phase });
	const features = extractFeatures({ position });

	const rows = FEATURES.map((feature) => ({
		key: feature.key,
		i18nKey: feature.i18nKey,
		family: feature.family,
		value: features[feature.id],
		weight: blended[feature.id],
		points: features[feature.id] * blended[feature.id],
	}))
		.filter((row) => row.weight !== 0)
		.toSorted((left, right) => Math.abs(right.points) - Math.abs(left.points));

	return { total: rows.reduce((sum, row) => sum + row.points, 0), phase, rows };
}
