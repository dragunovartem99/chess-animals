import type { Matchup } from "../rating";
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

// The seeding round's comparison graph: a ring (stride 1) so every bot has neighbours and the
// graph is connected, plus chords at wider strides until each bot has `degree` opponents. 20 bots
// at degree 4 is 40 pairs, not the 190 of a full round robin — enough for a first fit, and the
// adaptive rounds spend their games wherever that fit leaves ratings close. Falls back to every
// pair once the ring would double back on itself (small rosters).
export function seedPairs({ ids, degree }: { ids: readonly string[]; degree: number }): Pair[] {
	const n = ids.length;
	if (n < 2) return [];
	const maxStride = Math.floor(n / 2);
	if (degree >= n - 1) return allPairs(ids);

	const seen = new Set<string>();
	const pairs: Pair[] = [];
	for (let stride = 1; stride <= Math.min(Math.ceil(degree / 2), maxStride); stride += 1) {
		for (let i = 0; i < n; i += 1) {
			const a = ids[i];
			const b = ids[(i + stride) % n];
			const key = pairKey(a, b);
			if (a !== b && !seen.has(key)) {
				seen.add(key);
				pairs.push({ a, b });
			}
		}
	}
	return pairs;
}

// pairKey → the stronger side's win share so far, both colors summed. `nextPairings` drops any
// pair already above 0.95 here: one bot has all but settled it and more games cannot reorder them.
export function decisivenessOf(matchups: Iterable<Matchup>): Map<string, number> {
	const acc = new Map<string, { wins: Map<string, number>; games: number }>();
	for (const m of matchups) {
		const key = pairKey(m.white, m.black);
		const t = acc.get(key) ?? { wins: new Map<string, number>(), games: 0 };
		t.wins.set(m.white, (t.wins.get(m.white) ?? 0) + m.whiteWins);
		t.wins.set(m.black, (t.wins.get(m.black) ?? 0) + m.blackWins);
		t.games += m.whiteWins + m.blackWins + m.draws;
		acc.set(key, t);
	}
	return new Map(
		[...acc].map(([key, t]) => [
			key,
			t.games === 0 ? 0 : Math.max(...t.wins.values()) / t.games,
		])
	);
}

// A game's worth is how much it can move the ratings: high when both bots are still uncertain
// (large standard errors) and the result is a coin flip (ratings close), low once a pair has been
// played many times. Picking the top `batchSize` by this each round is what lets the arena skip
// most of a round robin — a settled pair is never played again.
export function nextPairings({
	standings,
	playCounts,
	batchSize,
	decisiveness,
}: {
	standings: readonly Standing[];
	playCounts: ReadonlyMap<string, number>;
	batchSize: number;
	// pairKey → the fraction of games played so far that the stronger side won. A pair one bot has
	// won ≥95% of can never change the order, so it is dropped from contention outright rather than
	// merely down-weighted — otherwise a still-uncertain blowout pair keeps getting picked.
	decisiveness?: ReadonlyMap<string, number>;
}): Pair[] {
	const by = new Map(standings.map((standing) => [standing.id, standing]));

	const scored = allPairs(standings.map((standing) => standing.id)).flatMap((pair) => {
		const key = pairKey(pair.a, pair.b);
		if ((decisiveness?.get(key) ?? 0) >= 0.95) return [];
		const a = by.get(pair.a)!;
		const b = by.get(pair.b)!;
		const p = sigmoid((a.rating - b.rating) / (400 / Math.LN10));
		const uncertainty = a.stderr * a.stderr + b.stderr * b.stderr;
		const played = playCounts.get(key) ?? 0;
		// `p(1 - p)` alone would starve the top and bottom bots — every pair they are in is
		// lopsided — so a floor keeps a still-uncertain bot worth playing even against a distant
		// opponent, while an evenly-matched pair is still worth ~4× more.
		return [{ pair, value: (uncertainty * (p * (1 - p) + 0.06)) / (1 + played) }];
	});

	return scored
		.toSorted((x, y) => y.value - x.value)
		.slice(0, batchSize)
		.map((entry) => entry.pair);
}
