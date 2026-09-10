import type { Animal } from "./types";

// Watches the four centre squares rather than standing on them: `centerControl` counts what each
// side attacks there, where the Hippo's `centralization` counts how far its pieces stand from the
// rim. A bishop on the long diagonal is worth as much to the Eagle as a knight on e5.
//
// Plain material at depth 2 otherwise — the Monkey with one idea — and the lab rated that idea at
// ~+100 over the Monkey across three runs, the second-strongest single weight at depth 2 after
// `kingDanger`, which is the Lion's.
export const EAGLE: Animal = {
	emoji: "🦅",
	tint: "#4a6b8a",
	definition: {
		id: "eagle",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { centerControl: 30 },
	},
};
