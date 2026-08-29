import type { Chess } from "chessops/chess";

import { gamePhase } from "@/shared/chess";
import {
	extractFeatures,
	type FeatureFamily,
	FEATURES,
	interpolateWeights,
	type PhaseWeights,
	type PlayedMove,
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
// `played` is the move that produced the position. Without it every move-level feature reads
// zero, and a checkmate renders as an ordinary quiet position with a mildly bad score — the one
// term that decided the game missing from the one panel meant to explain it.
//
// Everything comes out **White-relative**, the way an engine reports a score: positive means
// White stands better, whoever happens to be on move. Internally the evaluation is written from
// the side to move's point of view — that is what negamax needs — so the whole thing is flipped
// once here when Black is to move. Without that flip the same position reads with opposite signs
// depending on whose turn it is, which is exactly as confusing as it sounds.
//
// Features whose weight is zero are left out, since a roster of animals switches most of them off.
export function explainPosition({
	position,
	weights,
	played,
}: {
	position: Chess;
	weights: PhaseWeights;
	played?: PlayedMove;
}): Breakdown {
	const phase = gamePhase(position);
	const blended = interpolateWeights({ weights, phase });
	const features = extractFeatures({ position, played });
	const sign = position.turn === "white" ? 1 : -1;

	const rows = FEATURES.map((feature) => ({
		key: feature.key,
		i18nKey: feature.i18nKey,
		family: feature.family,
		value: sign * features[feature.id],
		weight: blended[feature.id],
		points: sign * features[feature.id] * blended[feature.id],
	}))
		.filter((row) => row.weight !== 0)
		.toSorted((left, right) => Math.abs(right.points) - Math.abs(left.points));

	return { total: rows.reduce((sum, row) => sum + row.points, 0), phase, rows };
}
