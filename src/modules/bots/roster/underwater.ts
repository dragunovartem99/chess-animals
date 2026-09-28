import { CRAB } from "./crab";
import { DOLPHIN } from "./dolphin";
import { GOLDFISH } from "./goldfish";
import { HERRING } from "./herring";
import { JELLYFISH } from "./jellyfish";
import { LOBSTER } from "./lobster";
import { OCTOPUS } from "./octopus";
import { OTTER } from "./otter";
import { PENGUIN } from "./penguin";
import { PUFFERFISH } from "./pufferfish";
import { SEAL } from "./seal";
import { SHARK } from "./shark";
import { SHRIMP } from "./shrimp";
import { SQUID } from "./squid";
import { TURTLE } from "./turtle";
import type { Animal } from "./types";
import { WHALE } from "./whale";

// The third roster: Maia, a model of how people play, at sixteen ratings — the Elo it is asked to
// play at, not a rating the arena measured. Weakest first, evenly apart in measured strength, not
// in Elo: each rating is read off the arena's curve (see METHOD.md, "Three rosters"). Drawing a
// move stops getting stronger near the top of Maia's range, so the top five play the likeliest
// move instead — their Elo only shades which one that is.
export const UNDERWATER: Animal[] = [
	SHRIMP,
	HERRING,
	CRAB,
	JELLYFISH,
	PUFFERFISH,
	SEAL,
	SQUID,
	TURTLE,
	LOBSTER,
	GOLDFISH,
	OTTER,
	DOLPHIN,
	OCTOPUS,
	PENGUIN,
	SHARK,
	WHALE,
];
