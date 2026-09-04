// Aggregated results of every game one ordered pair played: `whiteWins` + `blackWins` + `draws`
// games with `white` on the white side. Color matters — the model carries a white-advantage
// term — so a pair that met both ways contributes two matchups.
export type Matchup = {
	white: string;
	black: string;
	whiteWins: number;
	blackWins: number;
	draws: number;
};

export type RatingOptions = {
	// Mean rating the weak Gaussian prior pulls toward. Only shifts the scale; differences and
	// standard errors are unaffected.
	anchor?: number;
	// Prior precision in natural-log-strength units. Small keeps the prior weak; non-zero is what
	// keeps an undefeated bot's rating finite. Default 0.25 — a prior SD near 350 Elo.
	priorPrecision?: number;
};

export type PlayerRating = {
	id: string;
	// Elo-scaled: `anchor + 400 / ln(10) * logStrength`.
	rating: number;
	// One standard error in the same Elo units, from the inverse Fisher information.
	stderr: number;
};

export type RatingResult = {
	players: PlayerRating[];
	// White's edge in Elo points, fitted jointly with the ratings.
	whiteAdvantage: number;
	// Rao–Kupper draw parameter ν ≥ 1: larger means more games drawn at equal strength.
	drawParam: number;
	iterations: number;
	converged: boolean;
};
