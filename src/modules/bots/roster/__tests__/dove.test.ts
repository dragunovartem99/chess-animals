import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { compileBot } from "@/shared/bots";
import { positionFromFen } from "@/shared/chess";
import { chooseMove } from "@/shared/engine";
import { createRng } from "@/shared/engine/rng";

import { ROSTER_BY_ID } from "../index";

const DOVE = ROSTER_BY_ID.get("dove")!.definition;

function reply({ fen, seed }: { fen: string; seed: number }): string {
	const bot = compileBot(DOVE);

	return makeUci(
		chooseMove({
			position: positionFromFen(fen),
			weights: bot.weights,
			search: bot.search,
			temperature: bot.temperature,
			rng: createRng(seed),
		})!
	);
}

describe("the Dove", () => {
	// The Italian, one move from Bxf7+ — a capture and a check at once, the two things it flees
	// hardest. Every seed, since declining it is a strictly better move by its weights.
	it.each([0, 1, 2, 3, 4])("declines a check that is also a capture on seed %i", (seed) => {
		const fen = "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 3";
		expect(reply({ fen, seed })).not.toBe("c4f7");
	});

	// A hanging knight next to the king, a spare pawn on the board so taking it is not an instant
	// draw. A material bot snaps the knight off; the Dove leaves it, because a capture of any size
	// scores worse than touching nothing.
	it.each([0, 1, 2, 3, 4])("walks past a free piece on seed %i", (seed) => {
		expect(reply({ fen: "7k/8/8/8/8/8/4n2P/4K3 w - - 0 1", seed })).not.toBe("e1e2");
	});
});
