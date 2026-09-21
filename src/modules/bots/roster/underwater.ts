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
// play at, not a rating the arena measured. Weakest first. The rungs are tight at the bottom,
// where a hundred points of Maia's Elo moves its strength the most, and wide at the top, where it
// barely moves at all; the Whale plays the likeliest move rather than drawing one.
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
