import { INITIAL_FEN } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { compileBot } from "@/shared/bots";
import { positionFromFen } from "@/shared/chess";
import { chooseMove } from "@/shared/engine";
import { createRng } from "@/shared/engine/rng";

import { ROSTER_BY_ID } from "../index";

const PARROT = ROSTER_BY_ID.get("parrot")!.definition;

// Play a line against the Parrot and collect what it answered each move with. Through
// `chooseMove` and a seed, which is the path the app plays on: pruned, and with the tie between
// equally good moves broken by the rng.
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
	const position = positionFromFen(INITIAL_FEN);
	const rng = createRng(seed);
	const replies: string[] = [];

	for (const move of white) {
		position.play(parseUci(move)!);
		const reply = chooseMove({
			position,
			weights: bot.weights,
			search: { ...bot.search, depth },
			temperature: bot.temperature,
			rng,
		})!;

		replies.push(makeUci(reply));
		position.play(reply);
	}

	return replies;
}

// Ten plies of the Giuoco Piano, which the Parrot has an answer to at every one of them.
const WHITE = ["e2e4", "g1f3", "f1c4", "d2d3", "b1c3", "e1g1", "c1g5", "d1d2", "a2a3", "h2h3"];
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
