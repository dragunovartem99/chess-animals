import type { Color } from "chessops/types";
import { opposite } from "chessops/util";

import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { summariseAgainst, summariseFiles } from "./pawnFiles";
import { PAWN_SLOTS, type PawnCounts } from "./pawnSlots";

export const SLOTS = PAWN_SLOTS.map(([, slot]) => slot);
import { isBackward, isConnected, isPassed } from "./pawnTests";
import { countShield } from "./pawnTraits";

// Contiguous runs of occupied files. Two islands are harder to hold than one chain of the same
// size, whoever owns more pawns.
function countIslands(counts: number[]): number {
	let islands = 0;
	let previous = false;

	for (const count of counts) {
		if (count > 0 && !previous) islands += 1;
		previous = count > 0;
	}

	return islands;
}

function countFor({ context, color }: { context: EvalContext; color: Color }): PawnCounts {
	const { board } = context.position;
	const pawns = board.pieces(color, "pawn");
	const king = board.kingOf(color);

	const ours = summariseFiles({ pawns, color });
	const theirs = summariseAgainst({ pawns: board.pieces(opposite(color), "pawn"), color });
	const covered = context.pawnAttacks[opposite(color)];
	const step = color === "white" ? 8 : -8;

	const counts: PawnCounts = {
		doubled: 0,
		isolated: 0,
		backward: 0,
		islands: countIslands(ours.counts),
		connected: 0,
		passed: 0,
		passedAdvancement: 0,
		shield: king === undefined ? 0 : countShield({ ours: pawns, king, color }),
	};

	for (let file = 0; file < 8; file += 1) counts.doubled += Math.max(0, ours.counts[file] - 1);

	const white = color === "white";

	for (const square of pawns) {
		const file = square & 7;
		const rank = white ? square >> 3 : 7 - (square >> 3);

		if ((file > 0 ? ours.counts[file - 1] : 0) + (file < 7 ? ours.counts[file + 1] : 0) === 0) {
			counts.isolated += 1;
		}

		const advance = square + step;
		const advanceCovered = advance >= 0 && advance < 64 && covered.has(advance);
		if (isBackward({ ours, file, rank, advanceCovered })) counts.backward += 1;
		if (isConnected({ pawns, square, file, step })) counts.connected += 1;

		if (isPassed({ ours, theirs, file, rank })) {
			counts.passed += 1;
			counts.passedAdvancement += rank;
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
