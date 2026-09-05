import { sigmoid } from "../rating";

export type Standing = { id: string; rating: number; stderr: number };
export type Pair = { a: string; b: string };

// An order-free key for the unordered pair, so play counts and dedup work regardless of which bot
// is named first. A ternary rather than `[a, b].toSorted().join()` — no array per call, and this
// runs once per pair per round.
export const pairKey = (a: string, b: string): string => (a < b ? `${a}::${b}` : `${b}::${a}`);

export function allPairs(ids: readonly string[]): Pair[] {
	const pairs: Pair[] = [];
	for (let i = 0; i < ids.length; i += 1) {
		for (let j = i + 1; j < ids.length; j += 1) pairs.push({ a: ids[i], b: ids[j] });
	}
	return pairs;
}

// A game's worth is how much it can move the ratings: high when both bots are still uncertain
// (large standard errors) and the result is a coin flip (ratings close), low once a pair has been
// played many times. Picking the top `batchSize` by this each round is what lets the arena skip
// most of a round robin — a settled pair is never played again.
export function nextPairings({
	standings,
	playCounts,
	batchSize,
}: {
	standings: readonly Standing[];
	playCounts: ReadonlyMap<string, number>;
	batchSize: number;
}): Pair[] {
	const by = new Map(standings.map((standing) => [standing.id, standing]));

	const scored = allPairs(standings.map((standing) => standing.id)).map((pair) => {
		const a = by.get(pair.a)!;
		const b = by.get(pair.b)!;
		const p = sigmoid((a.rating - b.rating) / (400 / Math.LN10));
		const uncertainty = a.stderr * a.stderr + b.stderr * b.stderr;
		const played = playCounts.get(pairKey(pair.a, pair.b)) ?? 0;
		// `p(1 - p)` alone would starve the top and bottom bots — every pair they are in is
		// lopsided — so a floor keeps a still-uncertain bot worth playing even against a distant
		// opponent, while an evenly-matched pair is still worth ~4× more.
		return { pair, value: (uncertainty * (p * (1 - p) + 0.06)) / (1 + played) };
	});

	return scored
		.toSorted((x, y) => y.value - x.value)
		.slice(0, batchSize)
		.map((entry) => entry.pair);
}
