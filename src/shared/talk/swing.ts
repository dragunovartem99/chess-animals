import type { Color } from "chessops/types";

import type { Score } from "./score";

// Centipawns a capture must net for the capturer to be remarked on. Read off the observer's
// search, which sees the recapture, so an even trade nets nothing and only a gain that holds
// counts. Material rather than win chance, which flattens once a side is a piece up and left the
// winner's captures unsaid. A clean minor piece clears it; a pawn, or a pawn and some position,
// does not.
export const MATERIAL = 300;

// Plies a side stays quiet after a remark, so one exchange — a capture, the recapture, the check
// that follows — is one remark rather than three.
export const COOLDOWN = 4;

export const mateFor = (score: Score): Color | undefined => {
	if (!("mate" in score)) return undefined;

	return score.mate > 0 ? "white" : "black";
};

// Whether `side` came out at least a minor piece up from one verdict to a later one. A mate on
// either side is the mate remark's business, not a capture's.
export function isWin({ from, to, side }: { from: Score; to: Score; side: Color }): boolean {
	if (!("cp" in from && "cp" in to)) return false;

	return (side === "white" ? 1 : -1) * (to.cp - from.cp) >= MATERIAL;
}

// Whether `ply` is still inside the cooldown of the last remark, made at `lastPly`.
export function isQuiet({ ply, lastPly }: { ply: number; lastPly: number | undefined }): boolean {
	return lastPly !== undefined && ply - lastPly < COOLDOWN;
}
