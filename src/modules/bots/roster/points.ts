import measured from "./points.json";

// Written by `npm run arena`, never by hand — re-run it after adding or retuning an animal. An
// animal the last run never met shows no number.
const POINTS: Readonly<Record<string, number>> = measured;

// As the site prints it: the number, with a true minus sign below zero — a hyphen next to a star
// reads as a dash, not a sign. `undefined` for an animal the last run never met.
export function pointsOf(id: string): string | undefined {
	const points = POINTS[id];
	if (points === undefined) return undefined;

	return points < 0 ? `\u2212${-points}` : `${points}`;
}
