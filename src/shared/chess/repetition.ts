import type { Chess } from "chessops/chess";

import { hashInto } from "./positionHash";

// The fewest plies a repetition can span: a position cannot return in two, because the side that
// made a move is not the side that could undo it, and an odd gap has the wrong side to move.
//
const MIN_REPETITION_PLIES = 4;

// Long enough for a whole game plus the deepest line above it; it grows if a caller proves that
// wrong.
const INITIAL_ENTRIES = 512;

// The positions a line has already visited: the game so far from the caller, and the search's own
// ancestors on top of it. Every entry is two words, and the slot one past the end is scratch for
// the position being tested — so asking costs no allocation.
export type Repetition = {
	// The position an about-to-be-searched node descends from. Pushed once on entering a node and
	// popped on leaving it, so at any node the stack holds exactly that node's ancestors.
	push: (position: Chess) => void;
	pop: () => void;
	// Whether this position has stood on the board before, in the game or higher up this line.
	repeats: (position: Chess) => boolean;
};

export function createRepetition(): Repetition {
	let words = new Int32Array(INITIAL_ENTRIES * 2);
	let length = 0;

	// One slot past the end has to be writable: `repeats` hashes into it.
	function reserve(entries: number): void {
		if ((entries + 1) * 2 <= words.length) return;

		const grown = new Int32Array(words.length * 2);
		grown.set(words);
		words = grown;
	}

	return {
		push(position) {
			reserve(length + 1);
			hashInto({ position, words, at: length * 2 });
			length += 1;
		},

		pop() {
			length -= 1;
		},

		repeats(position) {
			// Nothing before the last capture or pawn move can be repeated, so `halfmoves` is
			// both the bound on the scan and the reason most nodes never hash at all.
			const back = Math.min(position.halfmoves, length);
			if (back < MIN_REPETITION_PLIES) return false;

			hashInto({ position, words, at: length * 2 });
			const low = words[length * 2];
			const high = words[length * 2 + 1];

			// Every entry in reach, rather than every second one counted back by gap. Quiescence
			// pushes nothing it searches, so an index here is not reliably a distance and
			// stepping by two would compare against the wrong position. Nothing is lost by
			// looking at all of them: the side to move is part of the hash, so an entry at the
			// wrong parity cannot match, and one at an unexpected distance is still a position
			// this line has genuinely stood in.
			for (let at = (length - back) * 2; at < length * 2; at += 2) {
				if (words[at] === low && words[at + 1] === high) return true;
			}

			return false;
		},
	};
}
