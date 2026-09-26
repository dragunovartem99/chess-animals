import type { Facts } from "../facts";
import type { Heard } from "../gain";
import type { Score } from "../score";

// A game as the talk heard it, from ply 0 on: each ply's verdict, in centipawns or as a mate, and
// what its move did — a quiet move on a level board, which the observer's reply leaves as it is,
// unless told otherwise.
export const game = (...plies: [Score, Partial<Facts>?][]): Heard[] =>
	plies.map(([score, facts = {}], ply) => {
		const { material = 0, settled = material } = facts;
		return { verdict: { ply, score }, facts: { check: false, ...facts, material, settled } };
	});

// Plies with nothing to say about them, to start a game with.
export const level = (plies: number): [Score][] => Array.from({ length: plies }, () => [{ cp: 0 }]);
