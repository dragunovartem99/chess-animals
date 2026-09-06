import { BEAR } from "./bear";
import { DODO } from "./dodo";
import { DONKEY } from "./donkey";
import { DOVE } from "./dove";
import { ELEPHANT } from "./elephant";
import { FOX } from "./fox";
import { GOAT } from "./goat";
import { HARE } from "./hare";
import { HEDGEHOG } from "./hedgehog";
import { HIPPO } from "./hippo";
import { LEMMING } from "./lemming";
import { MONKEY } from "./monkey";
import { OWL } from "./owl";
import { PARROT } from "./parrot";
import { RAVEN } from "./raven";
import { RHINO } from "./rhino";
import { SPIDER } from "./spider";
import { TIGER } from "./tiger";
import { TURTLE } from "./turtle";
import type { Animal } from "./types";
import { WOLF } from "./wolf";

// The roster, weakest first: the order is the one `npm run arena` measured, not one anybody
// picked. Re-run the arena after adding or retuning an animal and move it if its rating moved.
//
// The Donkey is no longer the floor. Two animals rate below it: the Dove (the paper's `pacifist`,
// which declines every check and capture) and the Lemming (`generous`, which forces them), and
// the arena has the Donkey beating both badly. The Dodo (`suicide_king`, which walks its king at
// the enemy) lands just above the Donkey instead: a king in the open is real pressure. All three
// still lose to every animal with an actual positional idea.
//
// The calibration animals read no personality feature — they are the scale, not filler. The
// Donkey moves at random; the Monkey is plain material at depth 2, the Owl the same at depth 3.
// Each ply is worth a landslide: the Owl beats the Monkey ~19-in-20 and finished ahead of every
// one-feature animal, so a single heuristic at depth 2 does not buy what a ply does.
//
// The Raven is the calibration line's answer to "and what is seeing a trade through worth?" —
// the Owl's depth 3 with `quiescence` on, no idea otherwise. It is the strongest bot on the
// roster by a distance, beating the Hare ~9-in-10: on a material-only search the one blunder that
// matters is grabbing a piece that is recaptured, and resolving the captures past the leaf is
// worth more than a fourth ply or any pair of positional weights.
//
// The one-idea animals are a tour of the registry: the Fox never leaves a piece catchable, the
// Lemming reads the same `offeredMaterial` with the sign flipped and hands everything over, the
// Spider gives every piece the most squares it can reach, the Hippo holds the centre, the
// Hedgehog grabs everything and hangs nothing, the Wolf charges the whole army at the enemy king
// (at -400 it overcommits — the earlier Wolf tuned nearer -200), the Turtle pulls it all home,
// the Goat chases checks and captures, the Parrot mirrors the board, the Elephant keeps to its
// own colour, the Dove refuses to fight at all, and the Dodo runs its king at yours.
//
// The two-feature animals are depth 3 and pair two weights the lab rated together: the Hare
// (`offeredMaterial` + `hanging`) is second overall, the Bear (`centralization` + `space`) and
// the Rhino (`mobility` + `opponentMobility`) next, all three above the plain Owl — two heuristics
// and depth 3 beat one more ply with none, but not the Raven's quiescence.
//
// The Tiger is the exception: depth 3, quiescence on *and* three aggressive-mobile weights
// (`swarm` + `mobility` + `space`). Once every bot has quiescence, bare material has no idea what
// a good square is — the lab-only run had the Tiger's build beating the Raven's 86-14. Placed
// last provisionally; a `--lab` roster run to fix its exact rank is still pending.
export const ROSTER: Animal[] = [
	DOVE,
	LEMMING,
	DONKEY,
	DODO,
	GOAT,
	PARROT,
	TURTLE,
	ELEPHANT,
	WOLF,
	MONKEY,
	HIPPO,
	HEDGEHOG,
	SPIDER,
	FOX,
	OWL,
	RHINO,
	BEAR,
	HARE,
	RAVEN,
	TIGER,
];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

export type { Animal };
