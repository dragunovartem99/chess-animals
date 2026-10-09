import { castlingSide, normalizeMove } from "chessops/chess";
import type { Chess } from "chessops/chess";
import { isNormal } from "chessops/types";
import type { NormalMove } from "chessops/types";
import { kingCastlesTo, makeUci, parseUci } from "chessops/util";

// chessops names castling by the rook's square (`e1h1`); standard UCI, and so Stockfish, by the
// king's landing square (`e1g1`).

export function toUci({ position, move }: { position: Chess; move: NormalMove }): string {
	const side = castlingSide(position, move);
	if (side === undefined) return makeUci(move);

	return makeUci({ from: move.from, to: kingCastlesTo(position.turn, side) });
}

export function fromUci({
	position,
	uci,
}: {
	position: Chess;
	uci: string;
}): NormalMove | undefined {
	const parsed = parseUci(uci);
	if (!parsed || !isNormal(parsed)) return undefined;

	const move = normalizeMove(position, parsed);

	return isNormal(move) && position.isLegal(move) ? move : undefined;
}
