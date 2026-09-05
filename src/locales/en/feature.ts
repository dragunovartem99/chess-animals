// Keyed by `Feature.i18nKey` — every entry in the eval registry has a label here and in ru.
// Each label names the quantity the slider measures, from our own side's point of view; the sign
// of the weight is what says whether the bot wants more of it or less. Keep them short — they
// caption a slider.
export default {
	materialPawn: "Pawn value",
	materialKnight: "Knight value",
	materialBishop: "Bishop value",
	materialRook: "Rook value",
	materialQueen: "Queen value",
	kingAttackers: "Attackers on our king",
	kingOpenFile: "Open files by our king",
	kingPawnDistance: "King-to-pawn distance",
	swarm: "Army near enemy king",
	huddle: "Army around our king",
	kingProximity: "King-to-king distance",
	reverseStarting: "March to mirrored setup",
	sameColorSquares: "Pieces on own colour",
	symmetryMirrorY: "Mirrored ranks",
	opponentMobility: "Opponent's reach",
	pushDepth: "Pawns past halfway",
	offeredMaterial: "Material left hanging",
	givesMate: "Move gives mate",
	givesCheck: "Move gives check",
	givesStalemate: "Move gives stalemate",
	captureValue: "Captured piece value",
	isPromotion: "Move promotes",
	centerControl: "Centre control",
	space: "Space in enemy half",
	hanging: "Undefended pieces",
	mobility: "Our pieces' reach",
	centralization: "Pieces off the rim",
};
