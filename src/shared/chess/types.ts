import type { Color } from "chessops/types";

/** Who scored the point. `null` is a draw; an unfinished game has no result at all. */
export type GameResult = Color | null;

export type EndReason =
	| "checkmate"
	| "stalemate"
	| "insufficient-material"
	| "fifty-move"
	| "repetition"
	| "ply-limit";

export type GameStatus = { over: false } | { over: true; result: GameResult; reason: EndReason };
