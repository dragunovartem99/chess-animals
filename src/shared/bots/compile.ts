import { weightsFromRecord } from "../eval";
import { weightsOn } from "./bases";
import type { BotConfig, BotDefinition } from "./types";

// Turns the authored form into the vector the search reads: the base, the bot's own weights over
// the top of it, and everything else silent.
export function compileBot(definition: BotDefinition): BotConfig {
	return {
		id: definition.id,
		search: definition.search,
		temperature: definition.temperature,
		weights: weightsFromRecord(weightsOn(definition)),
	};
}
