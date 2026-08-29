export { extractFeatures } from "./extract";
export {
	defineFeatures,
	type Feature,
	type FeatureDefinition,
	type FeatureFamily,
	FEATURE_COUNT,
	FEATURES,
	FEATURES_BY_KEY,
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
