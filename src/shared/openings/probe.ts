import { positionFromFen, repetitionKey } from "../chess";
import { openings } from "./set";
import type { Opening } from "./types";

// Board, side to move and rights, without the move counters — the same key repetition is judged
// on. Two FENs that differ only in halfmove clock probe to the same opening.
function key(fen: string): string {
	return repetitionKey(positionFromFen(fen));
}

// The `probe(fen)` interface a Polyglot book reader will implement later. For now it only answers
// "is this position one of ours" — enough for `bot.useBook` to be honoured as a no-op and for the
// arena to recognise a game's opening.
export function probe(fen: string): Opening | undefined {
	const target = key(fen);
	return openings.find((opening) => key(opening.fen) === target);
}
