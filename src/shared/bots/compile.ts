import { type PhaseWeights, weightsFromRecord } from "../eval";
import type { BotConfig, BotDefinition } from "./types";

// Turns the authored form into the vectors the search reads. An omitted phase falls back to the
// middlegame, which is the one every definition must give.
export function compileBot(definition: BotDefinition): BotConfig {
	const { middlegame, opening = middlegame, endgame = middlegame } = definition.weights;

	const weights: PhaseWeights = {
		opening: weightsFromRecord(opening),
		middlegame: weightsFromRecord(middlegame),
		endgame: weightsFromRecord(endgame),
	};

	return {
		id: definition.id,
		search: definition.search,
		temperature: definition.temperature,
		weights,
	};
}
