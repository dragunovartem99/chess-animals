// What a feature measures — not where it came from. The weight editor groups its sliders by this
// and takes each family's slider band from it, so a family that lumps unlike quantities together
// gives them the wrong band.
//
// It used to be cut by origin instead, with a `behavioural` drawer for "the Elo World
// strategies". That split the pairs animals are actually built from: `mobility` and
// `opponentMobility` are one measurement taken of the two sides — the Spider reads one and the
// Snake the other — yet sat in different families on different scales, and `hanging` and `offeredMaterial` — the
// Hare, and the lab's two strongest features — did the same. Origin is what the comments beside
// the entries are for.
export type FeatureFamily =
	// What each side's pieces are worth.
	| "material"
	// Reach, ground and good squares: what a side can do.
	| "activity"
	// What is about to be lost — ours and theirs, since every feature is a difference.
	| "safety"
	// Where the army stands relative to a king. The paper's distance strategies.
	| "distance"
	// Properties of the whole board rather than of a side, so they read the same from either seat.
	| "shape"
	// A property of the move that produced the position, not of the position itself.
	| "move";

export type FeatureDefinition = {
	// Stable identifier. It is what a bot config stores, what a UCI `setoption` names, and what
	// the locale files key their labels on, so renaming one breaks saved bots — don't.
	key: string;
	family: FeatureFamily;
	defaultWeight: number;
};

export type Feature = FeatureDefinition & {
	// Index into every feature and weight vector. Assigned from registry order, never stored.
	id: number;
	i18nKey: string;
};

// Assigns dense ids in declaration order and rejects a duplicate key, which would otherwise show
// up much later as two sliders silently driving the same weight.
export function defineFeatures(definitions: readonly FeatureDefinition[]): Feature[] {
	const seen = new Set<string>();

	return definitions.map((definition, id) => {
		if (seen.has(definition.key)) throw new Error(`duplicate feature key "${definition.key}"`);
		seen.add(definition.key);

		return { ...definition, id, i18nKey: `feature.${definition.key}` };
	});
}

// The vocabulary every bot is described in. Entries are appended as their extraction lands; the
// order is the vector layout, so entries are never reordered or removed.
//
// **Every weight is in centipawns**, and a pawn is 100. That is the whole convention, and it is
// what makes a weight readable: `mobility: 4` says a square of activity is worth four hundredths
// of a pawn, and `swarm: 900` says walking the army a king-move closer is worth a queen. A bot
// that wants a feature to dominate says so with a big number, not by shrinking everything else —
// the roster used to price a pawn at 20 so that `huddle` could outweigh it, which made every
// animal's numbers unreadable and comparable to nothing.
//
// The two game-enders are the only exception: they are preferences in [-1, 1], because what they
// price is not worth a number of pawns. See `terminal.ts`.
export const FEATURES = defineFeatures([
	// Piece values are features rather than constants, so a bot can be given its own — one that
	// thinks a rook is worth two knights is one number away.
	{ key: "materialPawn", family: "material", defaultWeight: 100 },
	{ key: "materialKnight", family: "material", defaultWeight: 320 },
	{ key: "materialBishop", family: "material", defaultWeight: 330 },
	{ key: "materialRook", family: "material", defaultWeight: 500 },
	{ key: "materialQueen", family: "material", defaultWeight: 900 },

	// Danger around the king rather than on it: what attacks the squares he stands among, ours
	// minus theirs — so a negative weight buys safety and a positive one is `suicide_king`. It was
	// `kingAttackers`, which read as "attackers on our king" and left the sign to be explained
	// every time; the quantity never changed, only the name that carries its direction.
	//
	// A `kingRingDefenders` count sat here too and the lab rated it −46 against bare
	// material — defenders that are just pieces standing near the king, with no read on whether
	// they defend anything, told the evaluation to keep its army home and lose. A `kingOpenFile`
	// count of the pawnless files beside him went the other way: two sweeps rated it +17 and +19,
	// inside the noise, and nothing weighted it — `kingDanger` already reads the open line as
	// the piece now aiming down it.
	{ key: "kingDanger", family: "safety", defaultWeight: -12 },

	// The Elo World strategies. Each is a weight here rather than a separate player class, so a
	// bot can be one part swarm, one part material, and rated on the same scale as the rest —
	// which is also why they are filed by what they measure like everything else, and not in a
	// drawer of their own.
	//
	// All three distances are negated on the way out of the extractor, so more is nearer and a
	// positive weight means the behaviour the key names. See `families/proximity.ts`.
	{ key: "swarm", family: "distance", defaultWeight: 0 },
	{ key: "huddle", family: "distance", defaultWeight: 0 },
	{ key: "kingProximity", family: "distance", defaultWeight: 0 },
	// Shape is a property of the whole board, not of a side, so unlike every other feature these
	// read identically from either seat — which is why the animals on them must run at an even
	// depth, negamax flipping a leaf's sign once per ply.
	{ key: "sameColorSquares", family: "shape", defaultWeight: 0 },
	// The rank-flip mirror alone — the copycat symmetry, and the only one of the three an animal
	// has ever wanted. A pawn on e4 facing a pawn on e5 costs nothing, so maximising it answers
	// every move with the same move.
	{ key: "mirrorRanks", family: "shape", defaultWeight: 0 },
	// The same measurement `mobility` takes of our own side, kept apart so a bot can price taking
	// the opponent's moves away differently from having moves itself — the Snake prices only that.
	{ key: "opponentMobility", family: "activity", defaultWeight: 0 },
	{ key: "pushDepth", family: "activity", defaultWeight: 0 },
	// Material a side leaves catchable, counted once per way it can be taken. `hanging` below is
	// the same instinct as a count of undefended pieces, and the two together are the Hare — the
	// lab's strongest pair, which is why they share a family and a slider band.
	{ key: "offeredMaterial", family: "safety", defaultWeight: 0 },

	// Properties of the move that produced the position. They are what let `cccp` and `pacifist`
	// be weights rather than special-cased players. See `families/move.ts` for the sign
	// convention: a positive weight always means "the mover wants this".
	// The two game-enders are **preferences in [-1, 1]**, not scores: +1 chases it, -1 flees it,
	// 0 cannot see it. They are the only weights that are not centipawns, because the thing they
	// price is not worth a number of pawns — see `terminal.ts`.
	{ key: "givesMate", family: "move", defaultWeight: 1 },
	{ key: "givesCheck", family: "move", defaultWeight: 0 },
	// The paper calls out `min_oppt_moves` for not telling mate from stalemate "despite these
	// having very different results". A separate preference is what lets a bot tell them apart —
	// and lets one that would rather draw say so.
	{ key: "givesStalemate", family: "move", defaultWeight: 0 },
	{ key: "captureValue", family: "move", defaultWeight: 0 },

	{ key: "centerControl", family: "activity", defaultWeight: 8 },
	{ key: "space", family: "activity", defaultWeight: 2 },
	{ key: "hanging", family: "safety", defaultWeight: -15 },

	{ key: "mobility", family: "activity", defaultWeight: 4 },

	// A strategic stand-in for a piece-square table, role-agnostic on purpose: how far the minor
	// and major pieces stand from the rim. It replaced twelve per-role sliders (a centralization
	// and an advancement for each of the six roles) that no animal used, and the lab then rated it
	// a top-three feature on its own — a knight wanting the centre and a rook wanting the seventh
	// are the same instinct, and one number says it. The paired `advancement` term for pawns went
	// with the rest of the pawn family: every pawn-structure weight the registry carried — passed,
	// the lumped weakness, forwardness — measured at or below bare material in the lab, so the
	// family is gone rather than kept as a drawer of dead sliders.
	{ key: "centralization", family: "activity", defaultWeight: 0 },

	// Our knights and bishops off the back rank minus theirs — a plain count of developed minors.
	// It joins `activity` rather than a family of its own: "reach, ground and good squares" covers
	// getting a piece into play, and there is no game-phase mechanism to gate it because the
	// quantity decays to ~0 on its own once both sides' minors are out or traded.
	{ key: "development", family: "activity", defaultWeight: 15 },

	// Our minors still on their home square while our queen is already out (and not traded), minus
	// theirs — the queen-before-the-pieces mistake, as a positive count the negative default
	// punishes. Also `activity`, also no phase gate: it falls to 0 on its own once the minors
	// develop or the queen comes home.
	{ key: "earlyQueen", family: "activity", defaultWeight: -10 },

	// Our king's shelter minus theirs, in three states: +1 castled onto a wing, 0 still able to,
	// -1 with the rights spent and the king left in the centre. `kingDanger` reads the attack
	// once it arrives; this reads the decision that invites it, and costs no board walk to say.
	// Also `activity`, also no phase gate: by the endgame both sides have spent their rights and
	// the difference is usually 0 again.
	{ key: "castled", family: "activity", defaultWeight: 40 },

	// Our king's distance from the rim minus theirs, scaled by how little material is left — the
	// endgame's "activate the king". Unlike the whole-board `kingProximity` it is a real
	// side-to-move difference, so it needs no even depth. Opt-in, like `swarm`: it is phase-shaped
	// inside its extractor (`families/endgame.ts`), which is the one kind of phase-awareness the
	// single weight vector allows.
	{ key: "kingActivity", family: "activity", defaultWeight: 0 },

	// Our passed pawns weighted by how far they have run, minus theirs, scaled by how little
	// material is left — "push the passers". It is the removed pawn family's `passed` coming back
	// in one narrower shape: silent in the middlegame, where the lab found the old term at or below
	// bare material, and live only once the pieces are off. Opt-in, and on probation like it.
	{ key: "passedPawnPush", family: "activity", defaultWeight: 0 },

	// Enemy pawns we attack minus ours they attack, scaled by how little material is left — the
	// endgame's "go after their pawns". Opt-in, phase-shaped in `families/endgame.ts`.
	{ key: "attackEnemyPawns", family: "activity", defaultWeight: 0 },
]);

export const FEATURE_COUNT = FEATURES.length;

export const FEATURES_BY_KEY = new Map(FEATURES.map((feature) => [feature.key, feature]));

// Resolves a key to its vector slot once, at module load, so the extractor never looks anything
// up per node. A typo is a startup crash rather than a feature that silently reads zero.
export function featureId(key: string): number {
	const feature = FEATURES_BY_KEY.get(key);
	if (!feature) throw new Error(`unknown feature key "${key}"`);

	return feature.id;
}
