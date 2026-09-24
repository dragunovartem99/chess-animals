import type { Color } from "chessops/types";

import type { Score } from "./score";
import { winChance } from "./score";

// Lichess calls a drop of this much win chance a blunder. A capture that gains less is a trade,
// or a pawn in an even game, and says nothing: a remark on each would be noise.
export const SWING = 0.15;

// Plies a side stays quiet after a remark, so one exchange — a capture, the recapture, the check
// that follows — is one remark rather than three.
export const COOLDOWN = 4;

export const mateFor = (score: Score): Color | undefined => {
	if (!("mate" in score)) return undefined;

	return score.mate > 0 ? "white" : "black";
};

// How much win chance `side` gained from one verdict to a later one.
export function gained({ from, to, side }: { from: Score; to: Score; side: Color }): number {
	const rise = winChance(to) - winChance(from);

	return side === "white" ? rise : -rise;
}

// Whether `ply` is still inside the cooldown of the last remark, made at `lastPly`.
export function isQuiet({ ply, lastPly }: { ply: number; lastPly: number | undefined }): boolean {
	return lastPly !== undefined && ply - lastPly < COOLDOWN;
}
