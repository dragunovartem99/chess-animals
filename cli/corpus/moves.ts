import { Chess } from "chessops/chess";
import { makeUci } from "chessops/util";

import { afterMove, fenFromPosition, legalMoves } from "@/shared/chess";
import { createRng } from "@/shared/engine";

// The C board and move generator are checked against chessops on `moves.txt`. Each line is a
// position; one legal move in it; the position after; every legal move in `legalMoves` order;
// and perft(2) — the leaves two plies down, which catches a wrong move list one ply deeper than
// the list itself shows. Seeded random games rather than arena ones — a random mover castles,
// promotes to all four roles and captures en passant within a few hundred games, which a
// sensible bot rarely bothers to.
const GAMES = 500;
const MAX_PLIES = 120;
// One ply in SAMPLE is kept at random, so the start position does not repeat once per game.
const SAMPLE = 100;

// Random games give check every few plies, so one in CHECK_SAMPLE is plenty of evasions.
const CHECK_SAMPLE = 4;

// A sample of plies plus every special move — what make/unmake gets wrong — and a share of the
// checks, which is what legal generation gets wrong. A uniform sample is mostly shuffling.
function isSpecial(before: string, uci: string): boolean {
	return (
		uci.length === 5 || uci.slice(2, 4) === before.split(" ")[3] || /^e[18][ah][18]$/.test(uci)
	);
}

function perft2(position: Chess): number {
	let leaves = 0;
	for (const move of legalMoves(position))
		leaves += legalMoves(afterMove({ position, move })).length;
	return leaves;
}

export function moveLines(): string[] {
	const rng = createRng("engine-corpus");
	const lines: string[] = [];

	for (let game = 0; game < GAMES; game += 1) {
		const position = Chess.default();

		for (let ply = 0; ply < MAX_PLIES && !position.isEnd(); ply += 1) {
			const moves = legalMoves(position);
			const move = rng.pick(moves);
			const before = fenFromPosition(position);
			const uci = makeUci(move);
			const keep =
				isSpecial(before, uci) ||
				(position.isCheck() && rng.int(CHECK_SAMPLE) === 0) ||
				rng.int(SAMPLE) === 0;
			const legal = keep ? moves.map(makeUci).join(" ") : "";
			const leaves = keep ? perft2(position) : 0;

			position.play(move);
			if (keep)
				lines.push(`${before};${uci};${fenFromPosition(position)};${legal};${leaves}`);
		}
	}

	return lines;
}
