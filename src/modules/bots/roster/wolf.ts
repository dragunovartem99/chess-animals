import type { Animal } from "./types";

// The pack charge: every piece walks a step nearer the enemy king, whatever it costs on the way —
// the Sloth's instinct pointed the other way. `swarm` is the paper's own named player; the Tiger
// reads it too, at a thirtieth of the weight and braced by `space` and `mobility`.
//
// At 600 the charge outbids a minor piece, so it throws pieces at the king rather than merely
// preferring the squares near it. 400 sat level with the Monkey; 600 drops it a clear step below,
// and 700 starts to crowd the Sloth.
export const WOLF: Animal = {
	emoji: "🐺",
	tint: "#6b7885",
	definition: {
		id: "wolf",
		search: { depth: 2 },
		base: "material",
		weights: { swarm: 600 },
	},
};
