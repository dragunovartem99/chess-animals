import { DONKEY } from "./donkey";
import { ELEPHANT } from "./elephant";
import { GOAT } from "./goat";
import { HAWK } from "./hawk";
import { HEDGEHOG } from "./hedgehog";
import { MONKEY } from "./monkey";
import { PARROT } from "./parrot";
import type { Animal } from "./types";

// The roster, weakest first: the order is the one `npm run arena` measured, not one anybody
// picked, so a reader meets the animals in the order they are worth playing. Re-run the arena
// after retuning an animal and move it if its rating moved.
//
// The Monkey is a debugging control, not a tuned personality: plain material at depth 2, there
// to answer one question about the animals around it — is a blunder the animal's one idea, or
// just what any weights do at this depth? The Hawk sits just above it: the same material, aimed
// at the enemy king. The Hedgehog above them both is the counterexample — the Monkey plus a
// single safety instinct, worth more than material or an attack alone.
//
// Every animal reads a feature no other one does, so the roster is a tour of the registry.
export const ROSTER: Animal[] = [DONKEY, GOAT, PARROT, ELEPHANT, MONKEY, HAWK, HEDGEHOG];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

export type { Animal };
