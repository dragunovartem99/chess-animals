// The observer's verdict on a position from White's view: centipawns, or moves to mate — positive
// when White mates. Mate stays its own kind rather than folded into centipawns, as a monster's
// lines are, because "mate is coming" is a remark of its own.
export type Score = { cp: number } | { mate: number };
