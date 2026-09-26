import type { Role } from "chessops/types";

import { moverOf, VALUES } from "./facts";
import type { Facts } from "./facts";
import type { Verdict } from "./observer";

// A ply as the talk heard it: the observer's verdict on it and what the move did.
export type Heard = { verdict: Verdict; facts: Facts };

// Pawns an exchange must net for the capturer to be remarked on. A clean minor piece clears it; a
// pawn, or a pawn and some position, does not.
export const MATERIAL = 3;

// The piece the capture on `ply` won for the side that made it, if any: the most valuable it took
// in the run of captures that capture ends.
//
// Judged on the board, from before the run began to after the observer's reply to the capture,
// rather than by a swing in the observer's score: the observer sees a fork or a pin a move or two
// ahead, so by the capture the gain is long priced in and swings nothing, and once a game is won
// its score hardly moves for a piece either way. The reply is what tells a piece won from the
// first half of a trade.
export function pieceWon({ heard, ply }: { heard: readonly (Heard | undefined)[]; ply: number }) {
	const now = heard[ply];
	let start = ply - 1;
	while (start > 0 && heard[start]?.facts.captured) start -= 1;
	const first = heard[start];
	if (!now?.facts.captured || !first) return undefined;

	const sign = moverOf(ply) === "white" ? 1 : -1;
	if (sign * (now.facts.settled - first.facts.material) < MATERIAL) return undefined;

	const taken: Role[] = [];
	for (let at = ply; at > start; at -= 2) {
		const role = heard[at]?.facts.captured;
		if (role) taken.push(role);
	}
	return taken.reduce((best, role) => (VALUES[role] > VALUES[best] ? role : best));
}
