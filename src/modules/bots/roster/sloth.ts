import type { Animal } from "./types";

// The Monkey plus one instinct: keep every piece close to its own king. `huddle` rises as our
// pieces gather around our king and falls as theirs gather around theirs, so a positive weight
// pulls the whole army home and walls the king in. The arena walked the number up from 750 — 900
// sits right on the Parrot, 400 nearly reaches the Elephant, and 550 lands in the clear middle of
// that gap, hunkered enough to read as a sloth without folding.
//
// On `material` it still takes a free piece and still won't hang one, which is what keeps it off
// the floor: a huddle with no idea of what it's giving away is the Goat's rating, not this.
// Depth 2, temp 0. No other animal reads huddle. (Was the Turtle; renamed to free 🐢 for the
// underwater section, same weight.)
export const SLOTH: Animal = {
	emoji: "🦥",
	tint: "#8a7a5c",
	definition: {
		id: "sloth",
		search: { depth: 2 },
		base: "material",
		weights: { huddle: 550 },
	},
};
