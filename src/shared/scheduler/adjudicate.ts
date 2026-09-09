import type { Chess } from "chessops/chess";
import type { Color } from "chessops/types";

import type { Adjudication } from "./types";

// This roster is weak enough that a 10-pawn edge held for 6 plies is already decided — no bot
// here claws that back. Tighter than a normal engine match would dare, and worth ~nothing in
// accuracy against what it saves on the depth-3 games that dominate wall time.
export const DEFAULT_ADJUDICATION: Adjudication = { resignThreshold: 10, patience: 6 };

const VALUE: Record<string, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };

// White material minus black material, in pawns. Color-relative sign, unlike the eval, so the
// adjudicator never needs a weight vector to decide a game is over.
export function materialEdge(position: Chess): number {
	let edge = 0;
	for (const square of position.board.occupied) {
		const piece = position.board.get(square)!;
		edge += (piece.color === "white" ? 1 : -1) * VALUE[piece.role];
	}
	return edge;
}

// Fed the material edge once per ply. Returns the winner as soon as the edge has sat past the
// threshold for `patience` plies in a row — a run broken by even one ply back under resets it.
export function createAdjudicator({ resignThreshold, patience }: Adjudication): {
	verdict: (edge: number) => Color | undefined;
} {
	let streak = 0;
	let side: Color | undefined;

	return {
		verdict(edge) {
			const leader: Color | undefined =
				edge >= resignThreshold ? "white" : edge <= -resignThreshold ? "black" : undefined;

			streak = leader !== undefined && leader === side ? streak + 1 : leader ? 1 : 0;
			side = leader;

			return streak >= patience ? leader : undefined;
		},
	};
}
