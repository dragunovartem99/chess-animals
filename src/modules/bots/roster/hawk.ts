import type { Animal } from "./types";

// An aggressor between the Monkey and the Hedgehog. `kingAttackers` is the attack weight massed
// on our king minus the weight massed on theirs — a queen next to the king counts five, a pawn
// one — so a negative weight pays the Hawk to point its pieces at the enemy king (and, the same
// number, to keep them off its own). No other animal reads it.
//
// On `material` at 40 it is worth about a pawn to bring a rook to bear on the king: enough to
// steer the quiet moves toward an attack without ever declining a real capture. The arena puts
// it above the Monkey's aimless material and below the Hedgehog's safety. Depth 2, temp 0.
export const HAWK: Animal = {
	emoji: "🦅",
	tint: "#5a7788",
	definition: {
		id: "hawk",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { kingAttackers: -40 },
	},
};
