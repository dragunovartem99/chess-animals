import type { Board } from "chessops/board";
import type { Castles } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import type { Color } from "chessops/types";
import { squareFile, squareRank } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { FILES, relativeRank } from "./masks";

const CENTRALIZATION = featureId("centralization");
const DEVELOPMENT = featureId("development");
const EARLY_QUEEN = featureId("earlyQueen");
const CASTLED = featureId("castled");

export const SLOTS = [CENTRALIZATION, DEVELOPMENT, EARLY_QUEEN, CASTLED];

// Files a piece starts its game on, from either side: knights b/g, bishops c/f, the queen d.
const HOME_FILE = { knight: [1, 6], bishop: [2, 5] } as const;
const QUEEN_FILE = 3;

// The a–c and g–h files: where a castled king ends up, or the corner beside it.
const WINGS = [0, 1, 2, 6, 7].reduce((mask, file) => mask.union(FILES[file]), SquareSet.empty());

// On its own back rank and on one of its starting files — the square a piece has not moved from.
function atHome({
	color,
	square,
	files,
}: {
	color: Color;
	square: number;
	files: readonly number[];
}): boolean {
	return relativeRank({ color, square }) === 0 && files.includes(squareFile(square));
}

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
function centrality(square: number): number {
	const file = squareFile(square);
	const rank = squareRank(square);

	return Math.min(file, 7 - file) + Math.min(rank, 7 - rank);
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
		castled += sign * castledState({ board, castles, color });

		for (const role of ["knight", "bishop", "rook", "queen"] as const) {
			for (const square of board.pieces(color, role)) central += sign * centrality(square);
		}

		// The queen has left her home square but is still on the board — a queen home, or traded,
		// or never developed is not an early one.
		const queens = board.pieces(color, "queen");
		const queenOut =
			queens.nonEmpty() &&
			![...queens].some((square) => atHome({ color, square, files: [QUEEN_FILE] }));

		for (const role of ["knight", "bishop"] as const) {
			for (const square of board.pieces(color, role)) {
				// A minor counts as developed once it has left its own back rank — a plain count,
				// no read on whether the square is any good, which `centralization` supplies.
				if (relativeRank({ color, square }) > 0) developed += sign;
				// ...and as a piece the early queen jumped ahead of if it is still sitting at home.
				else if (queenOut && atHome({ color, square, files: HOME_FILE[role] })) {
					earlyQueen += sign;
				}
			}
		}
	}

	features[CENTRALIZATION] = central;
	features[DEVELOPMENT] = developed;
	// Negative default: a minor left behind the queen is a fault, and the weight's sign says so —
	// the family band stays "reach, ground and good squares", cf. `hanging` living in `safety`.
	features[EARLY_QUEEN] = earlyQueen;
	features[CASTLED] = castled;
}
