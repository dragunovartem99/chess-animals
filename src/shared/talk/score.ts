// The observer's verdict on a position from White's view: centipawns, or moves to mate — positive
// when White mates. Mate stays its own kind rather than folded into centipawns, as a monster's
// lines are, because "mate is coming" is a remark of its own.
export type Score = { cp: number } | { mate: number };

// Lichess's fit of centipawns to results. A swing is read on this curve so that the same pawn
// counts for a lot in a level game and for nothing when a side is already a rook up.
const SLOPE = 0.003_682_08;

// White's chance of winning, 0 to 1.
export function winChance(score: Score): number {
	if ("mate" in score) return score.mate > 0 ? 1 : 0;

	return 1 / (1 + Math.exp(-SLOPE * score.cp));
}
