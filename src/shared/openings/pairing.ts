import { openings } from "./set";
import type { Opening, OpeningGame } from "./types";

// Expands the set into the color-swapped schedule: every opening once each way. A pair of bots
// played over this list meets each position from both sides, so the paired score is a difference
// between the bots and not between the colors.
export function openingSchedule(list: readonly Opening[] = openings): OpeningGame[] {
	return list.flatMap((opening) => [
		{ openingId: opening.id, fen: opening.fen, swapColors: false },
		{ openingId: opening.id, fen: opening.fen, swapColors: true },
	]);
}
