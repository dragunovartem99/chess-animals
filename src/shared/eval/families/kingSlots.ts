import { featureId } from "../features";

export type KingCounts = {
	attackers: number;
	openFiles: number;
	pawnDistance: number;
};

export const KING_SLOTS: [keyof KingCounts, number][] = [
	["attackers", featureId("kingAttackers")],
	["openFiles", featureId("kingOpenFile")],
	["pawnDistance", featureId("kingPawnDistance")],
];
