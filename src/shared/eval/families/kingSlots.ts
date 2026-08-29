import { featureId } from "../features";

export type KingCounts = {
	attackers: number;
	defenders: number;
	openFiles: number;
	pawnDistance: number;
};

export const KING_SLOTS: [keyof KingCounts, number][] = [
	["attackers", featureId("kingAttackers")],
	["defenders", featureId("kingRingDefenders")],
	["openFiles", featureId("kingOpenFile")],
	["pawnDistance", featureId("kingPawnDistance")],
];
