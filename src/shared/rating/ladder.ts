import { solve } from "./linalg";
import type { PlayerRating } from "./types";

// A roster whose animals differ only in a strength knob — Maia's Elo, Stockfish's temperature —
// is a ladder: each rung is never weaker than the one below, and the knobs were read off a curve
// to sit evenly apart. So its ratings are fitted as one smooth curve over the rung index instead
// of taken one by one: every animal's number then draws on the games of all sixteen, and noise
// can no longer put a cooler monster below a hotter one. A quadratic, weighted by each rating's
// precision, so a ladder that really bends still shows it; a straight line would hide that.
//
// Smoothing must never hide a broken rung, so an animal further off the curve than `OUTLIER_Z`
// of its own standard errors is reported — a knob that no longer does what the curve says.
const OUTLIER_Z = 2.5;

const basis = (index: number) => [1, index, index * index];

export function smoothLadder({
	players,
	ladder,
}: {
	players: readonly PlayerRating[];
	ladder: readonly string[];
}): { ratings: Record<string, number>; outliers: string[] } {
	const byId = new Map(players.map((player) => [player.id, player]));
	const rungs = ladder.flatMap((id, index) => {
		const player = byId.get(id);
		return player ? [{ ...player, index }] : [];
	});
	// Three coefficients need three points; fewer is a fit that says nothing.
	if (rungs.length < 3) {
		return { ratings: Object.fromEntries(rungs.map((r) => [r.id, r.rating])), outliers: [] };
	}

	const normal = [0, 1, 2].map(() => [0, 0, 0]);
	const rhs = [0, 0, 0];
	for (const { index, rating, stderr } of rungs) {
		const weight = 1 / (stderr * stderr);
		const row = basis(index);
		row.forEach((a, i) => {
			rhs[i] += weight * a * rating;
			row.forEach((b, j) => (normal[i][j] += weight * a * b));
		});
	}
	const coefficients = solve(normal, rhs);
	const curve = (index: number) =>
		basis(index).reduce((sum, value, i) => sum + value * coefficients[i], 0);

	return {
		ratings: Object.fromEntries(rungs.map((r) => [r.id, curve(r.index)])),
		outliers: rungs
			.filter((r) => Math.abs(r.rating - curve(r.index)) > OUTLIER_Z * r.stderr)
			.map((r) => r.id),
	};
}
