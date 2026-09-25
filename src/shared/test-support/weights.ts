import { weightsFromRecord } from "../eval";
import type { WeightVector } from "../eval";

// Anything not named is silent, so a test turns on exactly one feature and sees what it alone
// does.
export function onlyWeights(record: Record<string, number>): WeightVector {
	return weightsFromRecord(record);
}

// A plausible, if untuned, player: the classical values and a little of every instinct a
// player has, for a test that needs a search with something to find rather than one feature.
const PLAYER = {
	givesMate: 1,
	materialPawn: 100,
	materialKnight: 320,
	materialBishop: 330,
	materialRook: 500,
	materialQueen: 900,
	mobility: 4,
	space: 2,
	centerControl: 8,
	development: 15,
	earlyQueen: -10,
	hanging: -15,
	kingDanger: -12,
};

export function playerWeights(): WeightVector {
	return weightsFromRecord(PLAYER);
}
