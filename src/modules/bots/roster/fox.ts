import type { Animal } from "./types";

// The trapper: prices every square it takes from you and closes the exits one by one, while
// never leaving a piece of its own attacked and undefended. `opponentMobility` is its own — no
// other animal reads it; `hanging` is the partner that keeps the hunt from costing material.
//
// `opponentMobility` alone barely beats bare material at depth 2 (+26): taking squares away is
// only worth it when the pieces doing it are safe. `hanging` −50 is what lifts it — `centerControl`
// in its place lost ~150.
export const FOX: Animal = {
	emoji: "🦊",
	tint: "#c2632e",
	definition: {
		id: "fox",
		search: { depth: 2 },
		base: "material",
		weights: { opponentMobility: -8, hanging: -50 },
	},
};
