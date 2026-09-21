import { BEAR } from "./bear";
import { CAMEL } from "./camel";
import { CRAB } from "./crab";
import { DODO } from "./dodo";
import { DOLPHIN } from "./dolphin";
import { DONKEY } from "./donkey";
import { DOVE } from "./dove";
import { ELEPHANT } from "./elephant";
import { FOX } from "./fox";
import { GOAT } from "./goat";
import { GOLDFISH } from "./goldfish";
import { HARE } from "./hare";
import { HEDGEHOG } from "./hedgehog";
import { HERRING } from "./herring";
import { JELLYFISH } from "./jellyfish";
import { LEMMING } from "./lemming";
import { LION } from "./lion";
import { LOBSTER } from "./lobster";
import { MONKEY } from "./monkey";
import { OCTOPUS } from "./octopus";
import { OTTER } from "./otter";
import { OWL } from "./owl";
import { PARROT } from "./parrot";
import { PENGUIN } from "./penguin";
import { PUFFERFISH } from "./pufferfish";
import { RAVEN } from "./raven";
import { SEAL } from "./seal";
import { SHARK } from "./shark";
import { SHRIMP } from "./shrimp";
import { SLOTH } from "./sloth";
import { SPIDER } from "./spider";
import { SQUID } from "./squid";
import { TIGER } from "./tiger";
import { TURTLE } from "./turtle";
import type { Animal } from "./types";
import { WHALE } from "./whale";
import { WOLF } from "./wolf";

// The roster, weakest first: the order is the one `npm run arena` measured, not one anybody
// picked. Re-run the arena after adding or retuning an animal and move it if its rating moved.
//
// The Donkey is no longer the floor. Two animals rate below it: the Dove (the paper's `pacifist`,
// which declines every check and capture) and the Lemming (`generous`, which forces them), and the
// arena has the Donkey beating both badly. The Dodo (`suicide_king`, which walks its king at the
// enemy) lands just above the Donkey instead: a king in the open is real pressure. All three still
// lose to every animal with an actual positional idea.
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
// The one-idea animals are a tour of the registry: the Fox closes your exits, the Hedgehog grabs
// everything and hangs nothing, the Wolf charges the whole army at the enemy king, the Sloth pulls
// it all home, the Elephant keeps to its own colour, the Parrot mirrors the board, the Spider gives
// every piece the most squares it can reach — at depth 1, a ply short of the rest, which is what
// drops it below the Parrot — the Goat chases checks and captures, the Dove refuses to fight at
// all, the Lemming hands everything over, and the Dodo runs its king at yours.
//
// The depth-3 animals without quiescence sit above the plain Owl: the Bear (`castled` + `huddle`)
// digs a den, and the Hare (`offeredMaterial` + `mobility`) is never in reach, on pairs the lab
// rated together — an idea and depth 3 beat one more ply with none, but not the Raven's quiescence.
//
// The Camel is the one animal whose idea waits for the ending: its king and passed pawns count
// for nothing until the pieces come off. On depth 2 with quiescence — a ply short of the Raven —
// it lands between the Hare and the Raven.
//
// The Tiger is the exception: depth 3, quiescence on *and* a board-control pair (`swarm` +
// `mobility`). Once every bot has quiescence, bare material has no idea what a good square is —
// the full-roster arena puts the Tiger top by a distance, beating the Raven ~7-in-8.
// The Lion is the Raven's search with `kingDanger` + `development` — it develops, then aims at your
// king, and keeps its queen home until then — and lands near the middle of the gap between the two.
export const ROSTER: Animal[] = [
	DOVE,
	LEMMING,
	DONKEY,
	DODO,
	GOAT,
	SPIDER,
	PARROT,
	ELEPHANT,
	SLOTH,
	WOLF,
	MONKEY,
	FOX,
	HEDGEHOG,
	OWL,
	BEAR,
	HARE,
	CAMEL,
	RAVEN,
	LION,
	TIGER,
];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

// The second roster, apart from the first on purpose: a sea animal is Stockfish diluted with one
// idea, and `ROSTER` stays the land order and the gauntlet `tune` measures against. The arena rates
// both together. Weakest first, as the arena measured them: `nodes` sets how well Stockfish sees, so
// the rating climbs with it, while `mix` falls from a third to none. Herring, Squid and Crab are
// within thirty points of each other, inside the noise, so their order is a coin's.
export const SEA: Animal[] = [
	HERRING,
	SQUID,
	CRAB,
	TURTLE,
	PUFFERFISH,
	LOBSTER,
	JELLYFISH,
	SHARK,
	SHRIMP,
	PENGUIN,
	OTTER,
	DOLPHIN,
	OCTOPUS,
	SEAL,
	WHALE,
	GOLDFISH,
];

// Everyone a player can meet, land then sea.
export const ANIMALS: Animal[] = [...ROSTER, ...SEA];

export const ANIMALS_BY_ID = new Map(ANIMALS.map((animal) => [animal.definition.id, animal]));

export type { Animal };
