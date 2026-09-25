import { MONSTERS, UNDERWATER } from "@/modules/bots/roster";
import type { Theme } from "@/shared/ui";

// Into a roster's world for as long as one of its animals is at the board, whoever picked it — the
// monsters' first, when an underwater animal plays one, as the stronger of the two.
const WORLDS = [
	{ theme: "monsters", ids: new Set(MONSTERS.map((animal) => animal.definition.id)) },
	{ theme: "sea", ids: new Set(UNDERWATER.map((animal) => animal.definition.id)) },
] as const;

export const worldOf = (players: string[]): Theme | undefined =>
	WORLDS.find(({ ids }) => players.some((id) => ids.has(id)))?.theme;
