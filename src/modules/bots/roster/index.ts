import { CROCODILE } from "./crocodile";
import { DODO } from "./dodo";
import { DONKEY } from "./donkey";
import { DOVE } from "./dove";
import { ELEPHANT } from "./elephant";
import { FOX } from "./fox";
import { GOAT } from "./goat";
import { HEDGEHOG } from "./hedgehog";
import { HIPPO } from "./hippo";
import { LEMMING } from "./lemming";
import { MONKEY } from "./monkey";
import { OWL } from "./owl";
import { PARROT } from "./parrot";
import { SPIDER } from "./spider";
import { TURTLE } from "./turtle";
import type { Animal } from "./types";
import { WOLF } from "./wolf";

// The roster, weakest first: the order is the one `npm run arena` measured, not one anybody
// picked. Re-run the arena after adding or retuning an animal and move it if its rating moved.
//
// The Donkey is no longer the floor. Two animals rate below it: the Dove (the paper's `pacifist`,
// which declines every check and capture) and the Lemming (`generous`, which forces them), and
// the arena has the Donkey beating both badly — 97% against the Dove, 80% against the Lemming.
// The Dodo (`suicide_king`, which walks its king at the enemy) lands just above the Donkey
// instead: a king in the open is real pressure. All three still lose to every animal with an
// actual positional idea.
//
// The four animals that read no personality feature are the calibration, not filler. The Donkey
// moves at random; the Monkey is plain material at depth 2; the Owl is the same at depth 3; the
// Crocodile looks one ply ahead but plays every capture out to the end. The Owl and the Crocodile
// finished first and second, ahead of every animal with an idea — one more ply of search, or
// seeing a trade through, outweighs any single heuristic the registry carries. That gap is the
// number every real animal is measured against.
//
// Each of the others is built around one feature, so the roster is a tour of the registry: the
// Fox never leaves a piece catchable and rates just behind the Crocodile for it, the Lemming
// reads the same `offeredMaterial` with the sign flipped and hands everything over, the Spider
// gives every piece the most squares it can reach, the Hippo holds the centre, the Hedgehog
// grabs everything and hangs nothing, the Wolf charges the whole army at the enemy king (at -400
// it overcommits — the earlier Wolf tuned nearer -200), the Turtle pulls it all home, the Goat
// chases checks and captures, the Parrot mirrors the board, the Elephant keeps to its own
// colour, the Dove refuses to fight at all, and the Dodo runs its king at yours.
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
	HEDGEHOG,
	HIPPO,
	SPIDER,
	FOX,
	CROCODILE,
	OWL,
];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

export type { Animal };
