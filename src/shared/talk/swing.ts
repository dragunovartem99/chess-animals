import type { Color } from "chessops/types";

import type { Score } from "./score";
import { winChance } from "./score";

// A move worth a remark: `by` blundered, or `by` now has a forced mate.
export type Swing = { kind: "blunder" | "mate"; by: Color };

// Lichess calls a drop of this much win chance a blunder. Anything smaller is left alone: weak
// animals trade inaccuracies every move, and a remark on each would be noise.
export const BLUNDER = 0.15;

// Plies a side stays quiet after a remark, so one exchange — a blunder, the recapture it
// allows, the recapture back — is one remark rather than three.
export const COOLDOWN = 4;

const mateFor = (score: Score): Color | undefined => {
	if (!("mate" in score)) return undefined;

	return score.mate > 0 ? "white" : "black";
};

// What `mover`'s move did, judged from the verdicts before and after it. Only the mover's own
// drop counts: a rise means the observer's fixed budget found late what an earlier move gave
// away, and that is the observer catching up, not a move worth a remark.
export function detectSwing({
	before,
	after,
	mover,
}: {
	before: Score;
	after: Score;
	mover: Color;
}): Swing | undefined {
	const mating = mateFor(after);
	if (mating && mateFor(before) !== mating) return { kind: "mate", by: mating };

	const drop = winChance(before) - winChance(after);
	const lost = mover === "white" ? drop : -drop;
	if (lost >= BLUNDER) return { kind: "blunder", by: mover };

	return undefined;
}

// Whether `ply` is still inside the cooldown of the last remark, made at `lastPly`.
export function isQuiet({ ply, lastPly }: { ply: number; lastPly: number | undefined }): boolean {
	return lastPly !== undefined && ply - lastPly < COOLDOWN;
}
