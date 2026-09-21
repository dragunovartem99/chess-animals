// Generated from src/shared/eval/features.ts by `npm run engine:features` — do not edit.
#ifndef ENGINE_FEATURE_IDS_H
#define ENGINE_FEATURE_IDS_H

// One slot per registry entry, numbered as the TS feature and weight vectors number them.
enum {
	FEATURE_MATERIAL_PAWN = 0,
	FEATURE_MATERIAL_KNIGHT = 1,
	FEATURE_MATERIAL_BISHOP = 2,
	FEATURE_MATERIAL_ROOK = 3,
	FEATURE_MATERIAL_QUEEN = 4,
	FEATURE_KING_DANGER = 5,
	FEATURE_SWARM = 6,
	FEATURE_HUDDLE = 7,
	FEATURE_KING_PROXIMITY = 8,
	FEATURE_SAME_COLOR_SQUARES = 9,
	FEATURE_MIRROR_RANKS = 10,
	FEATURE_OPPONENT_MOBILITY = 11,
	FEATURE_PUSH_DEPTH = 12,
	FEATURE_OFFERED_MATERIAL = 13,
	FEATURE_GIVES_MATE = 14,
	FEATURE_GIVES_CHECK = 15,
	FEATURE_CAPTURE_VALUE = 16,
	FEATURE_CENTER_CONTROL = 17,
	FEATURE_SPACE = 18,
	FEATURE_HANGING = 19,
	FEATURE_MOBILITY = 20,
	FEATURE_CENTRALIZATION = 21,
	FEATURE_DEVELOPMENT = 22,
	FEATURE_EARLY_QUEEN = 23,
	FEATURE_KING_ACTIVITY = 24,
	FEATURE_PASSED_PAWN_PUSH = 25,
	FEATURE_COUNT = 26
};

// The registry keys in slot order, for output that names a feature.
static const char *const FEATURE_KEYS[FEATURE_COUNT] = {
    [FEATURE_MATERIAL_PAWN] = "materialPawn",
    [FEATURE_MATERIAL_KNIGHT] = "materialKnight",
    [FEATURE_MATERIAL_BISHOP] = "materialBishop",
    [FEATURE_MATERIAL_ROOK] = "materialRook",
    [FEATURE_MATERIAL_QUEEN] = "materialQueen",
    [FEATURE_KING_DANGER] = "kingDanger",
    [FEATURE_SWARM] = "swarm",
    [FEATURE_HUDDLE] = "huddle",
    [FEATURE_KING_PROXIMITY] = "kingProximity",
    [FEATURE_SAME_COLOR_SQUARES] = "sameColorSquares",
    [FEATURE_MIRROR_RANKS] = "mirrorRanks",
    [FEATURE_OPPONENT_MOBILITY] = "opponentMobility",
    [FEATURE_PUSH_DEPTH] = "pushDepth",
    [FEATURE_OFFERED_MATERIAL] = "offeredMaterial",
    [FEATURE_GIVES_MATE] = "givesMate",
    [FEATURE_GIVES_CHECK] = "givesCheck",
    [FEATURE_CAPTURE_VALUE] = "captureValue",
    [FEATURE_CENTER_CONTROL] = "centerControl",
    [FEATURE_SPACE] = "space",
    [FEATURE_HANGING] = "hanging",
    [FEATURE_MOBILITY] = "mobility",
    [FEATURE_CENTRALIZATION] = "centralization",
    [FEATURE_DEVELOPMENT] = "development",
    [FEATURE_EARLY_QUEEN] = "earlyQueen",
    [FEATURE_KING_ACTIVITY] = "kingActivity",
    [FEATURE_PASSED_PAWN_PUSH] = "passedPawnPush",
};

#endif
