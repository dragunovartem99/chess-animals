import type { Board } from "chessops/board";
import { SquareSet } from "chessops/squareSet";
import type { Color } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

const SAME_COLOR_SQUARES = featureId("sameColorSquares");
const SYMMETRY_MIRROR_X = featureId("symmetryMirrorX");
const SYMMETRY_MIRROR_Y = featureId("symmetryMirrorY");
const SYMMETRY_ROT180 = featureId("symmetryRot180");

export const SLOTS = [SAME_COLOR_SQUARES, SYMMETRY_MIRROR_X, SYMMETRY_MIRROR_Y, SYMMETRY_ROT180];

const LIGHT = SquareSet.lightSquares();
const DARK = SquareSet.darkSquares();

// A square's mirror is one exclusive-or away: flipping the ranks inverts the high three bits, the
// files the low three, and a half-turn both. None of the three has a fixed point, so a square is
// never paired with itself.
const FLIP_RANKS = 56;
const FLIP_FILES = 7;
const HALF_TURN = 63;

// The paper's scoring: facing a piece with its opposite number costs nothing, facing the wrong
// piece of the right color costs a little, and an empty square opposite a piece costs more.
//
// Only occupied squares are walked, and a pair of two occupied squares is scored from the lower
// of the two, so an empty board is free and a bare endgame nearly so.
function asymmetry({ board, axis }: { board: Board; axis: number }): number {
	let penalty = 0;

	for (const square of board.occupied) {
		const mirror = square ^ axis;
		const there = board.get(mirror);

		if (!there) {
			penalty += 2;
			continue;
		}

		if (mirror < square) continue;

		const here = board.get(square)!;
		if (here.color === there.color) penalty += 2;
		else penalty += here.role === there.role ? 0 : 1;
	}

	return penalty;
}

// Pieces standing on squares of their own color — White on light, Black on dark. The childhood
// strategy, and one of the few that reliably reaches a plateau and then shuffles along it.
function onOwnColor({ board, color }: { board: Board; color: Color }): number {
	return board[color].intersect(color === "white" ? LIGHT : DARK).size();
}

// Shape rather than strength: how much a side's pieces sit on their own color, and how close the
// whole board is to being a mirror of itself. The three symmetries are whole-board properties, so
// like `kingProximity` they are raw values with nothing to subtract.
export function extractSymmetry({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board } = context.position;

	features[SAME_COLOR_SQUARES] =
		onOwnColor({ board, color: context.us }) - onOwnColor({ board, color: context.them });

	features[SYMMETRY_MIRROR_X] = -asymmetry({ board, axis: FLIP_FILES });
	features[SYMMETRY_MIRROR_Y] = -asymmetry({ board, axis: FLIP_RANKS });
	features[SYMMETRY_ROT180] = -asymmetry({ board, axis: HALF_TURN });
}
