import type { Animal } from "./types";

// `kingDanger` piles onto your king's ring; `development` hands it pieces that can reach it.
// `earlyQueen` keeps the queen home until the minors are out.
export const LION: Animal = {
	emoji: "🦁",
	tint: "#a0522d",
	definition: {
		id: "lion",
		search: { depth: 3, quiescence: true },
		base: "material",
		weights: {
			kingDanger: -40,
			development: 20,
			earlyQueen: -80,
			huddle: 20,
			centerControl: 30,
		},
	},
};
