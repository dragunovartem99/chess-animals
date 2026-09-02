import { DONKEY } from "./donkey";
import { SHARK } from "./shark";
import { SNAKE } from "./snake";
import { TURTLE } from "./turtle";
import type { Animal } from "./types";
import { WOLF } from "./wolf";

// The roster, weakest first: the order is the one `npm run arena` measured, not one anybody
// picked, so a reader meets the animals in the order they are worth playing. Re-run the arena
// after retuning an animal and move it if its rating moved.
export const ROSTER: Animal[] = [DONKEY, SHARK, SNAKE, TURTLE, WOLF];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

export type { Animal };
