import type { Animal } from "./types";

// Plain material, one ply deeper than the Monkey and nothing else. It reads no personality
// feature at all: it is the control that answers "what is another level of search worth with no
// idea to spend it on?" the way the Monkey answers it at depth two.
export const OWL: Animal = {
	emoji: "🦉",
	tint: "#7c5e40",
	definition: {
		id: "owl",
		search: { depth: 3 },
		temperature: 0,
		base: "material",
		weights: {},
	},
};
