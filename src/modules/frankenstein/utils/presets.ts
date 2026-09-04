import { ROSTER_BY_ID } from "@/modules/bots/roster";
import { compileBot } from "@/shared/bots";
import { FEATURES } from "@/shared/eval";

export const DEFAULT_DEPTH = 3;
// The sandbox runs its search in a worker, but a worker is still one thread: depth 4+ turns a
// slider tick into a multi-second stall before the next move, which is the opposite of "live".
export const MAX_DEPTH = 3;

export type Preset = { weights: Record<string, number>; depth: number; quiescence: boolean };

// Material only, at the registry's suggested values — every other feature at zero. A full record
// (every feature key present, including zeros) rather than a sparse one: seeding must overwrite
// whatever the sandbox had before, and a sparse record would leave a previously non-zero weight
// standing wherever the new seed leaves it at zero.
export function blankPreset(): Preset {
	const weights = Object.fromEntries(
		FEATURES.map((feature) => [
			feature.key,
			feature.family === "material" ? feature.defaultWeight : 0,
		])
	);

	return { weights, depth: DEFAULT_DEPTH, quiescence: true };
}

// The animal's own search depth and quiescence setting come along with its weights — a plausible
// starting point for exploring that animal's idea, not just its numbers. The depth is still
// capped at the sandbox's own limit, since a worker search at unbounded depth is what the cap
// exists to prevent.
export function presetFromBot(id: string): Preset | undefined {
	const animal = ROSTER_BY_ID.get(id);
	if (!animal) return undefined;

	const vector = compileBot(animal.definition).weights.middlegame;
	const weights = Object.fromEntries(
		FEATURES.map((feature) => [feature.key, vector[feature.id]])
	);

	return {
		weights,
		depth: Math.min(MAX_DEPTH, animal.definition.search.depth),
		quiescence: animal.definition.search.quiescence ?? false,
	};
}
