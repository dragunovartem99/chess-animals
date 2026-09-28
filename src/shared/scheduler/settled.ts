import type { Standing } from "./pairing";

// The ranking of ids, strongest first — what the stop condition compares.
export function standingOrder(standings: readonly Standing[]): string[] {
	return standings.toSorted((a, b) => b.rating - a.rating).map((standing) => standing.id);
}

// Stop the arena once the standing *order* — which is all it is graded on — has held for
// `stableRounds` refits in a row. A per-rung test on the confidence intervals ran beside this once
// and never fired first on a real roster, so it went.
export function orderSettled({
	orderHistory,
	stableRounds,
}: {
	orderHistory: readonly string[][];
	stableRounds: number;
}): boolean {
	if (orderHistory.length < stableRounds) return false;
	const recent = orderHistory.slice(-stableRounds).map((order) => order.join(" "));
	return new Set(recent).size === 1;
}
