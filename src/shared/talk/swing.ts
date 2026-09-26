import type { Color } from "chessops/types";

import type { Score } from "./score";

// Plies a side stays quiet after a remark, so one exchange — a capture, the recapture, the check
// that follows — is one remark rather than three.
export const COOLDOWN = 4;

export const mateFor = (score: Score): Color | undefined => {
	if (!("mate" in score)) return undefined;

	return score.mate > 0 ? "white" : "black";
};

// Whether `ply` is still inside the cooldown of the last remark, made at `lastPly`.
export function isQuiet({ ply, lastPly }: { ply: number; lastPly: number | undefined }): boolean {
	return lastPly !== undefined && ply - lastPly < COOLDOWN;
}
