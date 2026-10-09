import type { BotDefinition } from "@/shared/bots";

// Rated by `npm run arena -- --lab` (or `--lab-only`). A candidate graduates to the roster or is
// deleted, so this list is empty between experiments; findings go to LAB.md.
export function lab(id: string, weights: Record<string, number>, depth = 2): BotDefinition {
	return { id: `lab-${id}`, search: { depth }, base: "material", weights };
}

// The Lion's and the Tiger's search — depth 3, quiescence on, `material` base — with a weight stack over the top,
// for experiments that need every candidate on the same search as the roster's strongest bots.
// The `swarm`+`mobility`+`space` run that became the Tiger used this (see `../LAB.md`).
export function labQ(id: string, weights: Record<string, number>): BotDefinition {
	return {
		id: `lab-${id}`,
		search: { depth: 3, quiescence: true },
		base: "material",
		weights,
	};
}

export const LAB: BotDefinition[] = [];
