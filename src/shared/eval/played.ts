import type { Chess } from "chessops/chess";
import type { Move } from "chessops/types";

// The position a move was played from, alongside the move itself: what the move features read,
// and what the breakdown hands the engine so they read it.
export type PlayedMove = { parent: Chess; move: Move };
