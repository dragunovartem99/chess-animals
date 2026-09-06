import type { Animal } from "./types";

// The pack charge: every piece walks a step nearer the enemy king, whatever it costs on the way —
// the Sloth's instinct with the sign flipped. `swarm` is the paper's own named player, and no
// other animal reads it. An earlier Wolf tuned this weight down to about -200, so the number here
// is a starting point, not a verdict.
export const WOLF: Animal = {
	emoji: "🐺",
	tint: "#6b7885",
	definition: {
		id: "wolf",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { swarm: -400 },
	},
};
