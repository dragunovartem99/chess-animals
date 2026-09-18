import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { compileBot } from "@/shared/bots";
import { seedState } from "@/shared/engine";
import { engine } from "@/shared/test-support/wasm";

import { ROSTER_BY_ID } from "../index";

const PARROT = ROSTER_BY_ID.get("parrot")!.definition;

// Play a line against the Parrot and collect what it answered each move with — the path the app
// plays on: the game replayed from its moves, and one tie-break stream carried through it.
function answers({
	white,
	depth,
	seed = 0,
}: {
	white: string[];
	depth: number;
	seed?: number;
}): string[] {
	const bot = compileBot(PARROT);
	const options = { ...bot.search, depth };
	const moves: string[] = [];
	const replies: string[] = [];
	let rngState = seedState(seed);

	for (const move of white) {
		moves.push(move);
		const found = engine.search({
			fen: INITIAL_FEN,
			moves,
			weights: bot.weights,
			options,
			rngState,
		});
		rngState = found.rngState!;
		replies.push(found.best!);
		moves.push(found.best!);
	}

	return replies;
}

// Ten plies of the Giuoco Piano, which the Parrot has an answer to at every one of them. Castling
// is the king taking its rook on both sides, the form the engine replays.
const WHITE = ["e2e4", "g1f3", "f1c4", "d2d3", "b1c3", "e1h1", "c1g5", "d1d2", "a2a3", "h2h3"];
const MIRRORED = ["e7e5", "g8f6", "f8c5", "d7d6", "b8c6", "e8h8", "c8g4", "d8d7", "a7a6", "h7h6"];

describe("the Parrot", () => {
	// Every seed, not one: the mirror is a strictly better move than anything else on the board,
	// so no tie-break may reach past it. It did — a worse move came back from the pruned search
	// reading the top score, and 2...Ne7 was played one game in three.
	it.each([0, 1, 2, 3, 4])("answers a move with the same move on seed %i", (seed) => {
		expect(answers({ white: WHITE, depth: PARROT.search.depth, seed })).toEqual(MIRRORED);
	});

	// The one thing its definition is not free to change. A symmetry reads the same from either
	// seat, so negamax flips its sign every ply: at an odd depth the Parrot chases the least
	// mirrored board it can reach and answers 1.e4 with 1...a5. The comment in `parrot.ts` says
	// so; this is what holds the file to it.
	it("would chase the opposite at an odd depth, which is why its depth is even", () => {
		expect(PARROT.search.depth % 2).toBe(0);
		expect(answers({ white: ["e2e4"], depth: 1 })).not.toEqual(["e7e5"]);
	});
});
