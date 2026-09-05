import type { Animal } from "./types";

// The mirror: answer a move with the same move. `symmetryMirrorY` is the negated rank-flip
// asymmetry of the whole board, so a pawn on e4 facing a pawn on e5 costs nothing and every
// unanswered piece costs two — the Parrot maximises it by playing back whatever it was shown.
//
// **The depth must stay even, and quiescence off.** A symmetry is a property of the board, not of
// a side, so unlike every other feature it reads the same from either seat — and negamax negates
// a leaf once per ply. At depth 1 the Parrot answers 1.e4 with 1...a5, chasing the *least*
// mirrored board it can find; quiescence extends by however many captures a line holds, which
// puts the sign back in the air. Depth 2 evaluates with the Parrot to move again, which is both
// the right sign and the right moment: the mirror it wants is the one it has just completed.
//
// The `material` base is what makes it worth watching. Asymmetry runs two points to a broken
// pair, so at this weight one costs about a knight: it copies until copying would hang a piece,
// and then it has to think of something itself, which it cannot. A copycat on `mate` alone walks
// into the first tactic and the joke is over on move six.
export const PARROT: Animal = {
	emoji: "🦜",
	tint: "#6f8a45",
	definition: {
		id: "parrot",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { symmetryMirrorY: 150 },
	},
};
