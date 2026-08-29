import type { Color } from "chessops/types";
import { opposite, squareFile } from "chessops/util";

import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { ADJACENT_FILES, FILES, frontSpan, passedSpan, relativeRank } from "./masks";
import { PAWN_SLOTS, type PawnCounts } from "./pawnSlots";
import { countIslands, countShield, isBackward, isConnected } from "./pawnTraits";

function countFor({ context, color }: { context: EvalContext; color: Color }): PawnCounts {
	const { board } = context.position;
	const ours = board.pieces(color, "pawn");
	const theirs = board.pieces(opposite(color), "pawn");
	const king = board.kingOf(color);

	const counts: PawnCounts = {
		doubled: 0,
		isolated: 0,
		backward: 0,
		islands: countIslands(ours),
		connected: 0,
		passed: 0,
		passedAdvancement: 0,
		shield: king === undefined ? 0 : countShield({ ours, king, color }),
	};

	for (const file of FILES) counts.doubled += Math.max(0, ours.intersect(file).size() - 1);

	for (const square of ours) {
		if (!ours.intersects(ADJACENT_FILES[squareFile(square)])) counts.isolated += 1;
		if (isBackward({ context, color, square })) counts.backward += 1;
		if (isConnected({ ours, color, square })) counts.connected += 1;

		// Nothing of theirs ahead on this file or either neighbour, and none of ours in the way.
		if (
			!theirs.intersects(passedSpan({ color, square })) &&
			!ours.intersects(frontSpan({ color, square }))
		) {
			counts.passed += 1;
			counts.passedAdvancement += relativeRank({ color, square });
		}
	}

	return counts;
}

export function extractPawns({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const ours = countFor({ context, color: context.us });
	const theirs = countFor({ context, color: context.them });

	for (const [key, slot] of PAWN_SLOTS) features[slot] = ours[key] - theirs[key];
}
