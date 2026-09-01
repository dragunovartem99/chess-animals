// One balanced starting position for a paired game. `fen` is the position after a short book
// line; `id` keys the result cache, so it must be stable — never renumber the set.
export type Opening = {
	id: string;
	name: string;
	fen: string;
};

// An opening scheduled for one game. The arena plays every opening twice — once with the
// candidate as White (`swapColors: false`) and once as Black — so the first move's value cancels
// out of the paired score.
export type OpeningGame = {
	openingId: string;
	fen: string;
	swapColors: boolean;
};
