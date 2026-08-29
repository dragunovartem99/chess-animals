import { DONKEY } from "./donkey";
import { TURTLE } from "./turtle";
import type { Animal } from "./types";
import { WOLF } from "./wolf";

// The roster, in no particular order — the arena decides who is stronger, not this file.
export const ROSTER: Animal[] = [DONKEY, WOLF, TURTLE];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

export type { Animal };
