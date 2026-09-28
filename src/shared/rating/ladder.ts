import type { PlayerRating } from "./types";

// A roster whose animals differ only in a strength knob — Maia's Elo, Stockfish's temperature —
// is a ladder: the knobs were read off the arena's curve to sit evenly apart in strength. So its
// ratings are fitted as one straight line over the rung index, weighted by each rating's
// precision, instead of taken one by one: every animal's number then draws on the games of all
// sixteen, and noise can no longer put a cooler monster below a hotter one.
//
// The line assumes the rungs really are even, so it must never hide one that is not: an animal
// further off the line than `OUTLIER_Z` of its own standard errors is reported — a knob that no
// longer sits where the ladder says.
const OUTLIER_Z = 2.5;

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
		return player ? [{ ...player, index, weight: player.stderr ** -2 }] : [];
	});
	// A line needs two points; one is left as measured.
	if (rungs.length < 2) {
		return { ratings: Object.fromEntries(rungs.map((r) => [r.id, r.rating])), outliers: [] };
	}

	const sum = (term: (rung: (typeof rungs)[number]) => number) =>
		rungs.reduce((total, rung) => total + rung.weight * term(rung), 0);
	const total = sum(() => 1);
	const meanIndex = sum((r) => r.index) / total;
	const meanRating = sum((r) => r.rating) / total;
	const slope =
		sum((r) => (r.index - meanIndex) * (r.rating - meanRating)) /
		sum((r) => (r.index - meanIndex) ** 2);
	const line = (index: number) => meanRating + slope * (index - meanIndex);

	return {
		ratings: Object.fromEntries(rungs.map((r) => [r.id, line(r.index)])),
		outliers: rungs
			.filter((r) => Math.abs(r.rating - line(r.index)) > OUTLIER_Z * r.stderr)
			.map((r) => r.id),
	};
}
