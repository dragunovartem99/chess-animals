import { featureId } from "../features";

export type PawnCounts = {
	doubled: number;
	isolated: number;
	backward: number;
	islands: number;
	connected: number;
	passed: number;
	passedAdvancement: number;
	shield: number;
};

// One place where a pawn trait's name meets its vector slot, so neither list can drift.
export const PAWN_SLOTS: [keyof PawnCounts, number][] = [
	["doubled", featureId("pawnDoubled")],
	["isolated", featureId("pawnIsolated")],
	["backward", featureId("pawnBackward")],
	["islands", featureId("pawnIslands")],
	["connected", featureId("pawnConnected")],
	["passed", featureId("pawnPassed")],
	["passedAdvancement", featureId("pawnPassedAdvancement")],
	["shield", featureId("pawnShield")],
];
