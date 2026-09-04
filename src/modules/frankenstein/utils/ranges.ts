import type { FeatureFamily } from "@/shared/eval";

export type SliderRange = { min: number; max: number; step: number };

// One band per family, not per feature: families already group the sliders, and a per-feature
// band would need updating every time a feature is appended. The band only bounds the *slider* —
// the paired numeric input still accepts any value, which is what lets an outlier like the Wolf's
// `givesMate: 100000` be entered exactly even though no slider could usefully span that range.
export const FAMILY_RANGES: Record<FeatureFamily, SliderRange> = {
	material: { min: -500, max: 1500, step: 10 },
	positional: { min: -150, max: 150, step: 2 },
	pawns: { min: -150, max: 150, step: 2 },
	king: { min: -150, max: 150, step: 2 },
	behavioural: { min: -400, max: 400, step: 5 },
	move: { min: -1000, max: 1000, step: 5 },
};
