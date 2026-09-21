// The unit a game-ending position is scored in, and the reason `givesMate` is a preference in
// [-1, 1] rather than a number somebody has to guess. It only has to sit clear of the range an
// ordinary evaluation reaches — a full board of classical piece values is under ten thousand.
export const MATE_SCORE = 100_000;
