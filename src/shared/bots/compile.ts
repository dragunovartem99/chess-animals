import { weightsFromRecord } from "../eval";
import type { BotConfig, BotDefinition } from "./types";

// Turns the authored form into the vector the search reads.
export function compileBot(definition: BotDefinition): BotConfig {
	return {
		id: definition.id,
		search: definition.search,
		temperature: definition.temperature,
		weights: weightsFromRecord(definition.weights),
	};
}
