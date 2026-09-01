import type { BotDefinition } from "@/shared/bots";

// An animal is a bot plus the bit of it a reader sees. Its name and description live in the
// locale files under `bot.<id>.name` and `bot.<id>.description`, the same way feature labels do,
// so a new animal is untranslatable-by-accident rather than silently English-only.
export type Animal = {
	definition: BotDefinition;
	emoji: string;
	// A single hue that is this animal's identity on the roster — the badge behind its portrait,
	// its name, the card's hover edge. Not amber: amber is reserved for page/move state.
	tint: string;
};
