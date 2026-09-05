import { DONKEY } from "./donkey";
import { ELEPHANT } from "./elephant";
import { GOAT } from "./goat";
import { HEDGEHOG } from "./hedgehog";
import { MONKEY } from "./monkey";
import { PARROT } from "./parrot";
import type { Animal } from "./types";

// The roster, weakest first: the order is the one `npm run arena` measured, not one anybody
// picked, so a reader meets the animals in the order they are worth playing. Re-run the arena
// after retuning an animal and move it if its rating moved.
//
// The Monkey is a debugging control, not a tuned personality: plain material at depth 2, there
// to answer one question about the animals below it — is a blunder the animal's one idea, or
// just what any weights do at this depth? The Hedgehog is the counterexample above it: the
// Monkey plus a single instinct, which turns out to be worth more than material alone.
export const ROSTER: Animal[] = [DONKEY, GOAT, PARROT, ELEPHANT, MONKEY, HEDGEHOG];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

export type { Animal };
