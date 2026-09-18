import type { Chess } from "chessops/chess";
import { normalizeMove } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { makeUci } from "chessops/util";

import type { PlayedMove } from "../eval";
import type { Game } from "./engine";

// The game `extract` reads a position from: the parent and its one move when the move is known,
// so the move features see it, and the position alone otherwise. The move goes over normalised —
// castling as the king taking its rook, which is the only form the engine's replay accepts.
export function playedGame({ position, played }: { position: Chess; played?: PlayedMove }): Game {
	if (!played || !isNormal(played.move)) return { fen: makeFen(position.toSetup()) };

	const move = normalizeMove(played.parent, played.move);
	return { fen: makeFen(played.parent.toSetup()), moves: [makeUci(move)] };
}
