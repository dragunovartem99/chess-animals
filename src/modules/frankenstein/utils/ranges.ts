import type { FeatureFamily } from "@/shared/eval";

export type SliderRange = { min: number; max: number; step: number };

// One band per family, not per feature: families already group the sliders, and a per-feature
// band would need updating every time a feature is appended. The band only bounds the *slider* —
// the paired numeric input still accepts any value, so a weight deliberately outside its family's
// usual range can still be entered exactly.
export const FAMILY_RANGES: Record<FeatureFamily, SliderRange> = {
	material: { min: -500, max: 1500, step: 10 },
	activity: { min: -150, max: 150, step: 2 },
	safety: { min: -150, max: 150, step: 2 },
	// Wide, because a distance is measured in king moves and an animal built on one prices it
	// against its whole material base: the Sloth huddles at 550, which the old ±400 band could
	// not even reach.
	distance: { min: -1000, max: 1000, step: 5 },
	shape: { min: -400, max: 400, step: 5 },
	move: { min: -1000, max: 1000, step: 5 },
};
