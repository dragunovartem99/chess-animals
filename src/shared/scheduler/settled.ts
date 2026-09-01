import type { Standing } from "./pairing";

// The ranking of ids, strongest first — what the "stable order" stop condition compares.
export function standingOrder(standings: readonly Standing[]): string[] {
	return standings.toSorted((a, b) => b.rating - a.rating).map((standing) => standing.id);
}

// Stop the arena when either every rating is pinned down (its interval is under the target) or
// the order has not changed for a while — a run where the last few rounds only shuffled ties has
// nothing left to learn even if a CI is technically still wide.
export function ratingsSettled({
	standings,
	targetStderr,
	orderHistory,
	stableRounds,
}: {
	standings: readonly Standing[];
	targetStderr: number;
	orderHistory: readonly string[][];
	stableRounds: number;
}): boolean {
	if (standings.every((standing) => standing.stderr <= targetStderr)) return true;

	if (orderHistory.length < stableRounds) return false;
	const recent = orderHistory.slice(-stableRounds).map((order) => order.join(" "));
	return new Set(recent).size === 1;
}
