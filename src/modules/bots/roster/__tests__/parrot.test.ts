import { INITIAL_FEN } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { compileBot } from "@/shared/bots";
import { positionFromFen } from "@/shared/chess";
import { searchRoot } from "@/shared/engine";

import { ROSTER_BY_ID } from "../index";

const PARROT = ROSTER_BY_ID.get("parrot")!.definition;

// Play a line against the Parrot and collect what it answered each move with.
function answers({ white, depth }: { white: string[]; depth: number }): string[] {
	const bot = compileBot(PARROT);
	const position = positionFromFen(INITIAL_FEN);
	const replies: string[] = [];

	for (const move of white) {
		position.play(parseUci(move)!);
		const scored = searchRoot({
			position,
			weights: bot.weights,
			options: { ...bot.search, depth },
		});
		const best = scored.reduce((left, right) => (right.score > left.score ? right : left));

		replies.push(makeUci(best.move));
		position.play(best.move);
	}

	return replies;
}

// Ten plies of the Giuoco Piano, which the Parrot has an answer to at every one of them.
const WHITE = ["e2e4", "g1f3", "f1c4", "d2d3", "b1c3", "e1g1", "c1g5", "d1d2", "a2a3", "h2h3"];
const MIRRORED = ["e7e5", "g8f6", "f8c5", "d7d6", "b8c6", "e8h8", "c8g4", "d8d7", "a7a6", "h7h6"];

describe("the Parrot", () => {
	it("answers a move with the same move, castling included", () => {
		expect(answers({ white: WHITE, depth: PARROT.search.depth })).toEqual(MIRRORED);
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
