import { attacks } from "chessops/attacks";
import type { Chess } from "chessops/chess";
import { SquareSet } from "chessops/squareSet";
import { type ByColor, COLORS, type Piece, ROLES } from "chessops/types";

import type { PieceReach } from "./context";

export type AttackMaps = {
	reach: PieceReach[];
	pawnAttacks: ByColor<SquareSet>;
	attacksBy: ByColor<SquareSet>;
};

// One man's entry in the walk, and his attacks folded into `acc` — the union as two raw halves,
// since `SquareSet.union` allocated a fresh set per man.
function visit({
	reach,
	acc,
	piece,
	square,
	occupied,
}: {
	reach: PieceReach[];
	acc: Int32Array;
	piece: Piece;
	square: number;
	occupied: SquareSet;
}): void {
	const squares = attacks(piece, square, occupied);
	reach.push({ square, piece, reach: squares });
	acc[0] |= squares.lo;
	acc[1] |= squares.hi;
}

// Reused across walks: filled and read back inside one call, which never recurses.
const acc = new Int32Array(2);

export function walkBoard(position: Chess): AttackMaps {
	const reach: PieceReach[] = [];
	const attacksBy = { white: SquareSet.empty(), black: SquareSet.empty() };
	const pawnAttacks = { white: SquareSet.empty(), black: SquareSet.empty() };
	const { occupied } = position.board;

	// Walked a colour and a role at a time off the bitboards that already separate them. The
	// board's own iterator works the other way round — it resolves every square's colour and role
	// by scanning eight sets, and hands back a fresh pair and a fresh `Piece` for each — which is
	// sixty-odd objects a node for facts that are one intersection away. The `Piece` here is
	// shared by every man of its kind, which nothing downstream may mutate and nothing does.
	//
	// The bits are walked by hand rather than through the set's generator, which allocated an
	// iterator and a result object per man — see `expand` in the move generator.
	for (const color of COLORS) {
		const ours = position.board[color];
		acc[0] = 0;
		acc[1] = 0;

		for (const role of ROLES) {
			const piece: Piece = { color, role };
			const men = position.board[role].intersect(ours);

			for (let bits = men.lo; bits !== 0; bits &= bits - 1) {
				visit({ reach, acc, piece, square: 31 - Math.clz32(bits & -bits), occupied });
			}
			for (let bits = men.hi; bits !== 0; bits &= bits - 1) {
				visit({ reach, acc, piece, square: 63 - Math.clz32(bits & -bits), occupied });
			}

			// `attacks` for a pawn is exactly its capture squares, and pawns lead `ROLES`, so the
			// pawn map is the union as it stands once they are done.
			if (role === "pawn") pawnAttacks[color] = new SquareSet(acc[0], acc[1]);
		}

		attacksBy[color] = new SquareSet(acc[0], acc[1]);
	}

	return { reach, pawnAttacks, attacksBy };
}
