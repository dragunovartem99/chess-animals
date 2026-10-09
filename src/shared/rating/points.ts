// Shifted, never stretched, until the Maia anchors sit at their asked-for Elo on average: a handful
// of anchors can't justify a stretch. Below zero means worse than any person.
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
