import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { compileBot } from "@/shared/bots";
import { positionFromFen } from "@/shared/chess";
import { chooseMove } from "@/shared/engine";
import { createRng } from "@/shared/engine/rng";

import { ROSTER_BY_ID } from "../index";

const LEMMING = ROSTER_BY_ID.get("lemming")!.definition;

function move({ fen, seed }: { fen: string; seed: number }): string {
	const bot = compileBot(LEMMING);

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

describe("the Lemming", () => {
	// White queen on d1, black pawns on c7 and e7. Qd6 puts the queen where both pawns take it —
	// the largest offer on the board, counted twice. Every seed: nothing else comes close.
	it.each([0, 1, 2, 3, 4])("shoves its queen where two pawns can take it on seed %i", (seed) => {
		expect(move({ fen: "4k3/2p1p3/8/8/8/8/8/3QK3 w - - 0 1", seed })).toBe("d1d6");
	});
});
