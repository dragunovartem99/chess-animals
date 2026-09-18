import { attacks } from "chessops/attacks";
import { SquareSet } from "chessops/squareSet";
import type { Piece } from "chessops/types";

import { createRng } from "@/shared/engine";

// The C attack tables are checked against chessops on `attacks.txt`: each line is a piece, a
// square, an occupancy and what the piece attacks from there, the sets as 16 hex digits. Leapers
// ignore occupancy, so they get one line a square; sliders get OCCUPANCIES each.
const OCCUPANCIES = 8;

const PIECES: [string, Piece][] = [
	["P", { role: "pawn", color: "white" }],
	["p", { role: "pawn", color: "black" }],
	["N", { role: "knight", color: "white" }],
	["B", { role: "bishop", color: "white" }],
	["R", { role: "rook", color: "white" }],
	["Q", { role: "queen", color: "white" }],
	["K", { role: "king", color: "white" }],
];

function hex(set: SquareSet): string {
	return (
		(set.hi >>> 0).toString(16).padStart(8, "0") + (set.lo >>> 0).toString(16).padStart(8, "0")
	);
}

export function attackLines(): string[] {
	// Its own seed, so the moves fixture stays byte-identical when this one changes.
	const rng = createRng("engine-attacks");
	const word = () => rng.int(2 ** 32);
	const lines: string[] = [];

	for (const [name, piece] of PIECES) {
		const slider = ["bishop", "rook", "queen"].includes(piece.role);

		for (let square = 0; square < 64; square += 1) {
			for (let sample = 0; sample < (slider ? OCCUPANCIES : 1); sample += 1) {
				// Two words ANDed for a board about a quarter full, as a middlegame is, with the
				// odd denser one so long rays get blocked at every distance.
				const dense = sample % 4 === 3;
				const occupied = slider
					? new SquareSet(word() & (dense ? ~0 : word()), word() & (dense ? ~0 : word()))
					: SquareSet.empty();
				lines.push(
					`${name} ${square} ${hex(occupied)} ${hex(attacks(piece, square, occupied))}`
				);
			}
		}
	}

	return lines;
}
