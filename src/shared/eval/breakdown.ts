import type { Chess } from "chessops/chess";

import { FEATURES } from "./features";
import type { FeatureFamily } from "./features";
import { terminalTerm } from "./terminal";
import type { FeatureVector, WeightVector } from "./vector";

export type Contribution = {
	key: string;
	i18nKey: string;
	family: FeatureFamily;
	// What the position reads for this feature, before any weight is applied.
	value: number;
	weight: number;
	// Their product: what this feature is actually worth here.
	points: number;
};

export type Breakdown = { total: number; rows: Contribution[] };

// One row, from a feature id and what the position reads for it. `sign` is the White-relative
// flip.
function contribution({
	id,
	value,
	weights,
	sign,
}: {
	id: number;
	value: number;
	weights: WeightVector;
	sign: number;
}): Contribution {
	const feature = FEATURES[id];

	return {
		key: feature.key,
		i18nKey: feature.i18nKey,
		family: feature.family,
		value: sign * value,
		weight: weights[id],
		points: sign * value * weights[id],
	};
}

// Why a bot likes a position, term by term. The rows sum to exactly the number the search would
// score this position at, which is what makes this a debugging tool rather than an illustration:
// if the bot plays a move this panel cannot explain, the panel is wrong, not the bot.
//
// `features` are the position's, read from the side to move with the move that produced it — the
// wasm engine's `extract`. Without that move every move-level feature reads zero, and a capture
// renders as a quiet position; the caller is the one who knows it.
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
	features,
}: {
	position: Chess;
	weights: WeightVector;
	features: FeatureVector;
}): Breakdown {
	const sign = position.turn === "white" ? 1 : -1;

	// A game-ending position is scored by one term that replaces the evaluation, so the panel
	// shows that one term rather than a table of contributions the search never added up.
	const terminal = terminalTerm({ position, weights });
	if (terminal) {
		const row = contribution({ ...terminal, weights, sign });

		return { total: row.points, rows: [row] };
	}

	const rows = FEATURES.map((feature) =>
		contribution({ id: feature.id, value: features[feature.id], weights, sign })
	)
		.filter((row) => row.weight !== 0)
		.toSorted((left, right) => Math.abs(right.points) - Math.abs(left.points));

	return { total: rows.reduce((sum, row) => sum + row.points, 0), rows };
}
