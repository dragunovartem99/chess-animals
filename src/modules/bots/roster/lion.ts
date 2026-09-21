import type { Animal } from "./types";

// The Raven's search with two ideas: `kingDanger` at -40, which reads what attacks the squares
// around each king, ours minus theirs, and `development`, which gets the minor pieces off the back
// rank. One negative weight keeps its own king's ring quiet and piles onto yours; developing first
// is what hands it pieces that can reach your ring at all.
//
// `kingDanger` alone sat barely above the Raven (+19 to +100 across runs). Adding `development`
// put it ~+110 on top and near the middle of the Raven-to-Tiger gap. `centerControl` as a
// third weight measured inside the noise. Most of the gain is `development` — the same weight
// with `centerControl` and no `kingDanger` rated level — but the Lion keeps the king idea as the
// thing it is.
//
// `earlyQueen` at -80 is manners, not strength: `kingDanger` pulls the queen at your king ring
// before the minors are out, and this makes it wait. It rated level either way; over twenty
// openings against the Owl it cut queen moves made with two minors still home from 34 to 10. At
// -40 the pull still won most of the time, and -150 started to cost rating.
//
// `huddle` 20 is the den underneath the hunt: LAB.md's open lead was that no animal on
// quiescence read it, and a narrow field against the old weights had it ahead twice running,
// within noise both times — the Raven-to-Tiger gap was flat before this, so a nudge that never
// lost is worth keeping.
//
// `centerControl` 30 came later, no other animal reads it: holding the middle is what a king hunt
// needs its pieces doing on the way in, distinct from the Tiger's `mobility` + `swarm` — the Lion
// still isn't a board-control animal, it's a king-hunt one that happens to want the center on the
// way. Beat the old weights by ~60 in the full-roster arena, `development` 40 in its place instead
// of alongside measured worse.
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
