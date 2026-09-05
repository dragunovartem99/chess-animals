import { featureId } from "../features";

export type KingCounts = {
	attackers: number;
	pawnDistance: number;
};

export const KING_SLOTS: [keyof KingCounts, number][] = [
	["attackers", featureId("kingAttackers")],
	["pawnDistance", featureId("kingPawnDistance")],
];
