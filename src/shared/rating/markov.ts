import type { Matchup } from "./types";

export type ChampionShare = { id: string; share: number };

// P(row beats column) across both colors. A pair that never met is left at 0.5 — neutral, so an
// unplayed edge neither helps nor hurts. Draws lower both entries: they are neither a win.
function beatMatrix(matchups: readonly Matchup[], ids: readonly string[]): number[][] {
	const index = new Map(ids.map((id, position) => [id, position]));
	const n = ids.length;
	const wins = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
	const games = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));

	for (const matchup of matchups) {
		const a = index.get(matchup.white)!;
		const b = index.get(matchup.black)!;
		const total = matchup.whiteWins + matchup.blackWins + matchup.draws;
		wins[a][b] += matchup.whiteWins;
		wins[b][a] += matchup.blackWins;
		games[a][b] += total;
		games[b][a] += total;
	}

	return wins.map((row, i) => row.map((won, j) => (games[i][j] > 0 ? won / games[i][j] : 0.5)));
}

// The paper's trophy chain: the champion faces a uniformly random challenger and keeps the
// trophy unless beaten. `beat[j][i]` is the challenger's win probability; a draw retains.
function transitionMatrix(beat: number[][]): number[][] {
	const n = beat.length;

	return beat.map((_, i) => {
		const row = beat.map((__, j) => (i === j ? 0 : beat[j][i] / (n - 1)));
		row[i] = 1 - row.reduce((sum, value) => sum + value, 0);
		return row;
	});
}

const l1Distance = (a: readonly number[], b: readonly number[]): number =>
	a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0);

// One π ← πP step, renormalised to sum to 1.
function advance(pi: readonly number[], transition: number[][]): number[] {
	const raw = pi.map((_, j) => pi.reduce((sum, mass, i) => sum + mass * transition[i][j], 0));
	const norm = raw.reduce((sum, value) => sum + value, 0);
	return raw.map((value) => value / norm);
}

// Left power iteration, run until the L1 step is negligible.
function stationary(transition: number[][]): number[] {
	let pi = Array.from({ length: transition.length }, () => 1 / transition.length);

	for (let step = 0; step < 10_000; step += 1) {
		const next = advance(pi, transition);
		if (l1Distance(next, pi) < 1e-13) return next;
		pi = next;
	}

	return pi;
}

// The paper's second opinion on the ratings: rank bots by the share of time each holds the
// trophy in the challenge chain. Shipped alongside the Bradley–Terry fit because the two
// disagree in interesting places — `same_color` in the paper.
export function markovChampion({ matchups }: { matchups: readonly Matchup[] }): ChampionShare[] {
	if (matchups.length === 0) throw new Error("no matchups to rank");

	const ids: string[] = [];
	for (const { white, black } of matchups) {
		for (const id of [white, black]) if (!ids.includes(id)) ids.push(id);
	}
	if (ids.length === 1) return [{ id: ids[0], share: 1 }];

	const shares = stationary(transitionMatrix(beatMatrix(matchups, ids)));
	return ids.map((id, i) => ({ id, share: shares[i] })).toSorted((a, b) => b.share - a.share);
}
