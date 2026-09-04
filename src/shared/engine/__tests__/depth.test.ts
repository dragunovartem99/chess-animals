import { describe, expect, it } from "vitest";

import { playPair, type TestBot } from "../../test-support/play";
import { defaultishWeights } from "../../test-support/weights";

// Four openings a few moves in, so the two bots do not simply replay one game. Colors are
// swapped inside `playPair`, so what is measured is the search, not the first move.
const OPENINGS = [
	"rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
	"rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
	"rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 2 2",
	"r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 3",
];

const weights = defaultishWeights({ givesMate: 100000, givesStalemate: -50000 });

const shallow: TestBot = { weights, search: { depth: 1 } };
const deep: TestBot = { weights, search: { depth: 2 } };

describe("search depth", () => {
	it("makes the same weights play better the further they look", { timeout: 300_000 }, () => {
		let score = 0;

		for (const [index, fen] of OPENINGS.entries()) {
			score += playPair({ one: deep, two: shallow, fen, plyLimit: 80, seed: index + 1 });
		}

		// Eight games, so a bot no better than its opponent would score about four.
		expect(score).toBeGreaterThan(4);
	});
});
