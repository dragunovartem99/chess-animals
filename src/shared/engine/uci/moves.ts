import { castlingSide, type Chess, normalizeMove } from "chessops/chess";
import { isNormal, type NormalMove } from "chessops/types";
import { kingCastlesTo, makeUci, parseUci } from "chessops/util";

// chessops names a castling move by the square the *rook* stands on — Chess960 style, `e1h1`.
// Standard UCI names the square the king lands on, `e1g1`, and that is what Stockfish and every
// other engine will send and expect. The two only ever differ for castling, but they differ for
// every castling move, so the conversion cannot be skipped.

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
