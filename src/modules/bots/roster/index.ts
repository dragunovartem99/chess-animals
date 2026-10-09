import { ALIEN } from "./alien";
import { BEAR } from "./bear";
import { CAMEL } from "./camel";
import { CLOWN } from "./clown";
import { DINOSAUR } from "./dinosaur";
import { DODO } from "./dodo";
import { DONKEY } from "./donkey";
import { DOVE } from "./dove";
import { DRAGON } from "./dragon";
import { ELEPHANT } from "./elephant";
import { FOX } from "./fox";
import { GENIE } from "./genie";
import { GHOST } from "./ghost";
import { GOAT } from "./goat";
import { GOBLIN } from "./goblin";
import { HARE } from "./hare";
import { IMP } from "./imp";
import { LEMMING } from "./lemming";
import { LION } from "./lion";
import { OGRE } from "./ogre";
import { PARROT } from "./parrot";
import { PUMPKIN } from "./pumpkin";
import { ROBOT } from "./robot";
import { SKELETON } from "./skeleton";
import { SLOTH } from "./sloth";
import { SPIDER } from "./spider";
import { TIGER } from "./tiger";
import { TROLL } from "./troll";
import type { Animal } from "./types";
import { UNDERWATER } from "./underwater";
import { VAMPIRE } from "./vampire";
import { WITCH } from "./witch";
import { WOLF } from "./wolf";
import { ZOMBIE } from "./zombie";

// Weakest first, in the order `npm run arena` measured — re-run it after adding or retuning an
// animal. Each animal's idea is in its own file.
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
	FOX,
	BEAR,
	HARE,
	CAMEL,
	LION,
	TIGER,
];

export const ROSTER_BY_ID = new Map(ROSTER.map((animal) => [animal.definition.id, animal]));

// Stockfish alone, softened; kept apart so `ROSTER` stays the land order. Weakest first, each `t`
// read off the arena's curve (METHOD.md, "Three rosters").
export const MONSTERS: Animal[] = [
	CLOWN,
	PUMPKIN,
	SKELETON,
	WITCH,
	ZOMBIE,
	ALIEN,
	GOBLIN,
	OGRE,
	TROLL,
	GHOST,
	VAMPIRE,
	IMP,
	GENIE,
	ROBOT,
	DINOSAUR,
	DRAGON,
];

export { UNDERWATER };
export { pointsOf } from "./points";

// Everyone a player can meet, in the order the site lists the rosters.
export const ANIMALS: Animal[] = [...ROSTER, ...UNDERWATER, ...MONSTERS];

export const ANIMALS_BY_ID = new Map(ANIMALS.map((animal) => [animal.definition.id, animal]));

export type { Animal };
