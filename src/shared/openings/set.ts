import { positionFromFen } from "../chess";
import data from "./openings.json";
import type { Opening } from "./types";

// The curated set, generated from short book lines and checked in as data. Loading it here (rather
// than trusting the JSON) means a hand-edit that breaks a FEN or collides an id fails a test, not
// a tournament halfway through.
export const openings: readonly Opening[] = data;

// Parses every FEN and asserts the ids are unique. Called by the set's own test; exported so a
// consumer that builds its own list can reuse the check.
export function validateOpenings(list: readonly Opening[] = openings): void {
	const ids = new Set<string>();
	for (const opening of list) {
		if (ids.has(opening.id)) throw new Error(`duplicate opening id "${opening.id}"`);
		ids.add(opening.id);
		positionFromFen(opening.fen);
	}
}
