import { type Feature, FEATURES, type FeatureFamily } from "@/shared/eval";

export const FAMILIES: FeatureFamily[] = ["material", "positional", "king", "behavioural", "move"];

// Families are not contiguous in registry order (`centerControl` and friends land back on
// `positional` after `king`/`behavioural`/`move`), so the weight panel groups them itself rather
// than relying on a single scan.
export function featuresByFamily(): Record<FeatureFamily, Feature[]> {
	const grouped: Record<FeatureFamily, Feature[]> = {
		material: [],
		positional: [],
		king: [],
		behavioural: [],
		move: [],
	};

	for (const feature of FEATURES) grouped[feature.family].push(feature);

	return grouped;
}
