// One balanced starting position for a paired game. `fen` is the position after a short book
// line; `id` keys the result cache, so it must be stable — never renumber the set.
export type Opening = {
	id: string;
	name: string;
	fen: string;
};
