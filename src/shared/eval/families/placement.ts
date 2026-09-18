import type { Board } from "chessops/board";
import type { Castles } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import type { Color } from "chessops/types";
import { squareFile, squareRank } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { FILES } from "./masks";

const CENTRALIZATION = featureId("centralization");
const DEVELOPMENT = featureId("development");
const EARLY_QUEEN = featureId("earlyQueen");
const CASTLED = featureId("castled");

export const SLOTS = [CENTRALIZATION, DEVELOPMENT, EARLY_QUEEN, CASTLED];

// The squares a piece starts its game on, from either side: knights b/g, bishops c/f, the queen d.
const HOME = {
	white: {
		knight: SquareSet.fromSquare(1).with(6),
		bishop: SquareSet.fromSquare(2).with(5),
		queen: 3,
	},
	black: {
		knight: SquareSet.fromSquare(57).with(62),
		bishop: SquareSet.fromSquare(58).with(61),
		queen: 59,
	},
} as const;

// The a–c and g–h files: where a castled king ends up, or the corner beside it.
const WINGS = [0, 1, 2, 6, 7].reduce((mask, file) => mask.union(FILES[file]), SquareSet.empty());

// Three states from the position alone, since the move history is not on hand: +1 with the king
// tucked on a wing of its own back rank, 0 while a right still lets it get there, -1 once the
// rights are spent and it is stuck in the middle. A king that walked to g1 by hand counts as
// castled — the shelter is the point, not the move that bought it.
function castledState({
	board,
	castles,
	color,
}: {
	board: Board;
	castles: Castles;
	color: Color;
}): number {
	const backrank = SquareSet.backrank(color);
	if (board.pieces(color, "king").intersects(WINGS.intersect(backrank))) return 1;

	return castles.castlingRights.intersects(backrank) ? 0 : -1;
}

// 0 on the rim, 6 on one of the four central squares. Cheaper than a table and, unlike one,
// tunable with a single number.
export function centrality(square: number): number {
	const file = squareFile(square);
	const rank = squareRank(square);

	return Math.min(file, 7 - file) + Math.min(rank, 7 - rank);
}

// The bits walked by hand rather than through the set's generator, which allocated an iterator
// and a result object per square on a path every node of a placement bot runs.
function totalCentrality(squares: SquareSet): number {
	let total = 0;
	for (let bits = squares.lo; bits !== 0; bits &= bits - 1) {
		total += centrality(31 - Math.clz32(bits & -bits));
	}
	for (let bits = squares.hi; bits !== 0; bits &= bits - 1) {
		total += centrality(63 - Math.clz32(bits & -bits));
	}
	return total;
}

// A strategic stand-in for a piece-square table in one number, not sixty-four and not the twelve
// per-role sliders this replaced: how far the pieces stand from the rim, king and pawns excluded —
// the king wants safety, and the pawn's own `advancement` term went with the rest of the pawn
// family when the lab rated every pawn-structure weight at or below bare material. It is the
// side-to-move's total minus the opponent's, so it reads the same from either seat.
export function extractPlacement({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { board, castles } = context.position;
	let central = 0;
	let castled = 0;
	let developed = 0;
	let earlyQueen = 0;

	for (const color of [context.us, context.them]) {
		const sign = color === context.us ? 1 : -1;
		const ours = board[color];
		const home = HOME[color];
		castled += sign * castledState({ board, castles, color });
		central += sign * totalCentrality(ours.diff(board.pawn).diff(board.king));

		// A minor counts as developed once it has left its own back rank — a plain count, no read
		// on whether the square is any good, which `centralization` supplies.
		const minors = ours.intersect(board.knight.union(board.bishop));
		developed += sign * minors.diff(SquareSet.backrank(color)).size();

		// The queen has left her home square but is still on the board — a queen home, or traded,
		// or never developed is not an early one. Each minor still at home is one she jumped.
		const queens = ours.intersect(board.queen);
		if (queens.nonEmpty() && !queens.has(home.queen)) {
			const knightsHome = ours.intersect(board.knight).intersect(home.knight).size();
			const bishopsHome = ours.intersect(board.bishop).intersect(home.bishop).size();
			earlyQueen += sign * (knightsHome + bishopsHome);
		}
	}

	features[CENTRALIZATION] = central;
	features[DEVELOPMENT] = developed;
	// Negative default: a minor left behind the queen is a fault, and the weight's sign says so —
	// the family band stays "reach, ground and good squares", cf. `hanging` living in `safety`.
	features[EARLY_QUEEN] = earlyQueen;
	features[CASTLED] = castled;
}
