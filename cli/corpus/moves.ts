import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { makeUci } from "chessops/util";

import { legalMoves } from "@/shared/chess";
import { createRng } from "@/shared/engine";

// The C board is checked against chessops on `moves.txt`: each line is a position, one
// legal move in it, and the position after, all as chessops plays them. Seeded random games
// rather than arena ones — a random mover castles, promotes to all four roles and captures en
// passant within a few hundred games, which a sensible bot rarely bothers to.
const GAMES = 1000;
const MAX_PLIES = 120;
// One ply in SAMPLE is kept at random, so the start position does not repeat once per game.
const SAMPLE = 100;

// chessops writes the en passant square only when a capture onto it is legal, which needs move
// generation; the C board lands before its move generator, so the fixture carries the square as
// chessops holds it internally — set on every double push — and the legal-only filter is tested
// once there is one.
function rawFen(position: Chess): string {
	return makeFen({ ...position.toSetup(), epSquare: position.epSquare });
}

// A sample of plies plus every special one: the special moves are what make/unmake gets wrong,
// and a uniform sample of a random game is mostly quiet shuffling.
function isSpecial(before: string, uci: string): boolean {
	return (
		uci.length === 5 || uci.slice(2, 4) === before.split(" ")[3] || /^e[18][ah][18]$/.test(uci)
	);
}

export function moveLines(): string[] {
	const rng = createRng("engine-corpus");
	const lines: string[] = [];

	for (let game = 0; game < GAMES; game += 1) {
		const position = Chess.default();

		for (let ply = 0; ply < MAX_PLIES && !position.isEnd(); ply += 1) {
			const move = rng.pick(legalMoves(position));
			const before = rawFen(position);
			const uci = makeUci(move);

			position.play(move);
			if (isSpecial(before, uci) || rng.int(SAMPLE) === 0)
				lines.push(`${before};${uci};${rawFen(position)}`);
		}
	}

	return lines;
}
