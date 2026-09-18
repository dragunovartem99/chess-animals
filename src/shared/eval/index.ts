export { type Breakdown, type Contribution, explainPosition } from "./breakdown";
export type { PlayedMove } from "./played";
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
	defaultRecord,
	defaultWeights,
	type FeatureVector,
	recordFromWeights,
	type WeightVector,
	weightsFromRecord,
} from "./vector";
export { MATE_SCORE, type TerminalTerm, terminalTerm } from "./terminal";
