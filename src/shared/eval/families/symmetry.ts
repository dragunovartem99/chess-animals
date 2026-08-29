import type { Board } from "chessops/board";
import { SquareSet } from "chessops/squareSet";
import { flipHorizontal, flipVertical, rotate180 } from "chessops/transform";
import type { Color } from "chessops/types";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

const SAME_COLOR_SQUARES = featureId("sameColorSquares");
const SYMMETRY_MIRROR_X = featureId("symmetryMirrorX");
const SYMMETRY_MIRROR_Y = featureId("symmetryMirrorY");
const SYMMETRY_ROT180 = featureId("symmetryRot180");

const LIGHT = SquareSet.lightSquares();
const DARK = SquareSet.darkSquares();

// The paper's scoring: facing a piece with its opposite number costs nothing, facing the wrong
// piece of the right colour costs a little, and anything else costs more. Summed over all 64
// squares and halved, since every pair is met twice.
function asymmetry({
	board,
	flip,
}: {
	board: Board;
	flip: (squares: SquareSet) => SquareSet;
}): number {
	let penalty = 0;

	for (let square = 0; square < 64; square += 1) {
		const [mirror] = flip(SquareSet.fromSquare(square));
		const here = board.get(square);
		const there = board.get(mirror);

		if (!here && !there) continue;
		if (!here || !there) {
			penalty += 2;
			continue;
		}

		if (here.color === there.color) penalty += 2;
		else penalty += here.role === there.role ? 0 : 1;
	}

	return penalty / 2;
}

// Pieces standing on squares of their own colour — White on light, Black on dark. The childhood
// strategy, and one of the few that reliably reaches a plateau and then shuffles along it.
function onOwnColour({ board, color }: { board: Board; color: Color }): number {
	return board[color].intersect(color === "white" ? LIGHT : DARK).size();
}

// Shape rather than strength: how much a side's pieces sit on their own colour, and how close the
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
		onOwnColour({ board, color: context.us }) - onOwnColour({ board, color: context.them });

	features[SYMMETRY_MIRROR_X] = -asymmetry({ board, flip: flipHorizontal });
	features[SYMMETRY_MIRROR_Y] = -asymmetry({ board, flip: flipVertical });
	features[SYMMETRY_ROT180] = -asymmetry({ board, flip: rotate180 });
}
