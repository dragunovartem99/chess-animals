import type { BotDefinition } from "@/shared/bots";

// The staging area for candidate animals. `npm run arena -- --lab` rates everything here
// alongside the roster, so a new idea gets a number against the Hedgehog before it earns a name,
// a locale entry and a place in `ROSTER`.
//
// Rules of the bench:
//   - every id starts `lab-` — that prefix is how the arena output and `cli/__tests__/lab.test.ts`
//     tell a candidate from a roster animal
//   - a candidate that graduates moves to `src/modules/bots/roster/` and is deleted from here
//   - a candidate that loses is deleted
// So this list is empty between experiments, and never a second roster.
//
// What past experiments turned up is in `../LAB.md` — a broad-feature ranking, and why
// `hanging` became the Hedgehog, `kingAttackers` the Hawk, `mobility` the Spider.
//
// `lab("kingatk", { kingAttackers: -40 })` is the shape — id gets the `lab-` prefix, `material`
// base and depth 2 unless the third argument says otherwise. `npm run arena -- --lab-only` rates
// the candidates against each other; `--lab` rates them alongside the roster.
export function lab(id: string, weights: Record<string, number>, depth = 2): BotDefinition {
	return { id: `lab-${id}`, search: { depth }, temperature: 0, base: "material", weights };
}

export const LAB: BotDefinition[] = [];
