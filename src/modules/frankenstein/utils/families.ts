import { type Feature, FEATURES, type FeatureFamily } from "@/shared/eval";

export const FAMILIES: FeatureFamily[] = [
	"material",
	"activity",
	"safety",
	"distance",
	"shape",
	"move",
];

// Families are not contiguous in registry order — order is the vector layout and may never be
// rearranged, so `centerControl` and friends land back on `activity` after the families declared
// between. The weight panel groups them itself rather than relying on a single scan.
export function featuresByFamily(): Record<FeatureFamily, Feature[]> {
	const grouped: Record<FeatureFamily, Feature[]> = {
		material: [],
		activity: [],
		safety: [],
		distance: [],
		shape: [],
		move: [],
	};

	for (const feature of FEATURES) grouped[feature.family].push(feature);

	return grouped;
}
