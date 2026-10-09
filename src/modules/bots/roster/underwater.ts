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

// Maia at sixteen asked-for Elos, spaced by measured strength (METHOD.md, "Three rosters").
// Sampling stops gaining near the top, so the top five play the likeliest move.
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
