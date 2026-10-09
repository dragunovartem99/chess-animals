import type { PlayerRating } from "./types";

// A ladder's rungs sit evenly apart in strength, so it is fitted as one weighted line over the rung
// index and noise can't swap neighbours. A rung off the line by `OUTLIER_Z` is reported.
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
