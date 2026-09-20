import { ELO_PER_LOG, sigmoid } from "../rating";
import type { Matchup } from "../rating";

const ANCHOR = 1500;

// Exact expected counts from the model — no sampling, so the fit should recover the inputs to
// several digits. `trueElo` is centred on the anchor; `white` is the Elo edge for the side to
// move first; `draw` is the Rao–Kupper ν.
export function synthesise({
	trueElo,
	white,
	draw,
	games,
}: {
	trueElo: Record<string, number>;
	white: number;
	draw: number;
	games: (a: string, b: string) => number;
}): Matchup[] {
	const beta = (id: string) => (trueElo[id] - ANCHOR) / ELO_PER_LOG;
	const h = white / ELO_PER_LOG;
	const d = Math.log(draw);
	const ids = Object.keys(trueElo);
	const matchups: Matchup[] = [];

	for (const w of ids) {
		for (const b of ids) {
			if (w === b) continue;
			const n = games(w, b);
			if (n === 0) continue;
			const delta = beta(w) + h - beta(b);
			const pWhite = sigmoid(delta - d);
			const pBlack = sigmoid(-delta - d);
			matchups.push({
				white: w,
				black: b,
				whiteWins: n * pWhite,
				blackWins: n * pBlack,
				draws: n * (1 - pWhite - pBlack),
			});
		}
	}

	return matchups;
}

// Mean exactly 1500, the default anchor — the prior pins the fitted mean there, so a set with a
// different mean would come back uniformly shifted (differences intact) and only look wrong.
export const TRUE_ELO = { wolf: 1700, fox: 1600, cat: 1520, donkey: 1400, rock: 1280 };
