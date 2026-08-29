import { HUDDLE_TURTLE } from "./huddleTurtle";
import { MOUSE } from "./mouse";
import { SWARM_WOLF } from "./swarmWolf";
import type { Animal } from "./types";

// The roster, in no particular order — the arena decides who is stronger, not this file.
export const ROSTER: Animal[] = [MOUSE, SWARM_WOLF, HUDDLE_TURTLE];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

export type { Animal };
