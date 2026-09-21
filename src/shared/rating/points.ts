// A rating as the site shows it. The arena's scale is relative — only differences between bots
// mean anything, and its zero sits wherever the fit happened to put it — so it is pinned to people
// instead: each anchor is a bot asked to play like people at a known rating (Maia, at its `elo`),
// and the whole scale is shifted until the anchors sit, on average, where they were asked to.
// Shift only, never stretch: the arena's gaps are what it measured, and a stretch would claim
// more than a handful of anchors can say.
//
// Rounded to tens, since the last digit is noise. Free to go below zero: the weakest animals are
// worse than any person, and a negative number says so — the paper this project comes from
// stretched the scale below zero on purpose.
export function toPoints({
	ratings,
	anchors,
}: {
	ratings: Record<string, number>;
	anchors: Record<string, number>;
}): Record<string, number> {
	const pinned = Object.entries(anchors).filter(([id]) => ratings[id] !== undefined);
	if (pinned.length === 0) throw new Error("no anchor was rated");

	const shift =
		pinned.reduce((sum, [id, elo]) => sum + elo - (ratings[id] ?? 0), 0) / pinned.length;

	return Object.fromEntries(
		Object.entries(ratings).map(([id, rating]) => [id, Math.round((rating + shift) / 10) * 10])
	);
}
