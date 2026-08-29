export { extractFeatures } from "./extract";
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
	defaultWeights,
	dot,
	type FeatureVector,
	recordFromWeights,
	type WeightVector,
	weightsFromRecord,
} from "./vector";
export { interpolateWeights, type PhaseWeights } from "./weights";
