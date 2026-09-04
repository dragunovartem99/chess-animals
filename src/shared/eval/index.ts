export { createExtractor, type ExtractFrame, extractFeatures } from "./extract";
export type { PlayedMove } from "./families/move";
export {
	defineFeatures,
	type Feature,
	type FeatureDefinition,
	type FeatureFamily,
	FEATURE_COUNT,
	FEATURES,
	FEATURES_BY_KEY,
	featureId,
} from "./features";
export {
	createFeatureVector,
	defaultRecord,
	defaultWeights,
	dot,
	type FeatureVector,
	recordFromWeights,
	type WeightVector,
	weightsFromRecord,
} from "./vector";
export { MATE_SCORE, type TerminalTerm, terminalScore, terminalTerm } from "./terminal";
export { interpolateWeights, liveSlots, type PhaseWeights } from "./weights";
