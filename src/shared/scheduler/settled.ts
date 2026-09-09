import type { Standing } from "./pairing";

// The ranking of ids, strongest first — what the "stable order" stop condition compares.
export function standingOrder(standings: readonly Standing[]): string[] {
	return standings.toSorted((a, b) => b.rating - a.rating).map((standing) => standing.id);
}

// Stop the arena once the standing *order* is safe — which is all it is graded on. Each adjacent
// rung is resolved when its gap is either wide (> `separationZ` combined SEs — confidently
// ordered) or tiny (< `tieZ` combined SEs — a coin-flip we take on the point estimate and stop
// paying to chase). Only a rung *in between* is worth more games. A whole order that has held for
// `stableRounds` refits is a second way out, for a rung that lingers on the band edge.
export function ratingsSettled({
	standings,
	separationZ,
	tieZ,
	orderHistory,
	stableRounds,
}: {
	standings: readonly Standing[];
	separationZ: number;
	tieZ: number;
	orderHistory: readonly string[][];
	stableRounds: number;
}): boolean {
	const ranked = standings.toSorted((a, b) => b.rating - a.rating);
	const everyRungResolved = ranked.every((cur, i) => {
		if (i === 0) return true;
		const above = ranked[i - 1];
		const gap = above.rating - cur.rating;
		const combinedSe = Math.hypot(above.stderr, cur.stderr);
		return gap > separationZ * combinedSe || gap < tieZ * combinedSe;
	});
	if (everyRungResolved) return true;

	if (orderHistory.length < stableRounds) return false;
	const recent = orderHistory.slice(-stableRounds).map((order) => order.join(" "));
	return new Set(recent).size === 1;
}
