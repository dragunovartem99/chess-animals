import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { compileBot } from "@/shared/bots";
import { positionFromFen } from "@/shared/chess";
import { chooseMove } from "@/shared/engine";
import { createRng } from "@/shared/engine/rng";

import { ROSTER_BY_ID } from "../index";

const DODO = ROSTER_BY_ID.get("dodo")!.definition;

// White king cornered on a1 with a spare pawn so the position is not a dead draw; from a1 only
// Kb2 closes the gap to the black king on e8.
const KINGS_APART = "4k3/8/8/8/8/8/P7/K7 w - - 0 1";

function move({ depth, seed }: { depth: number; seed: number }): string {
	const bot = compileBot(DODO);

	return makeUci(
		chooseMove({
			position: positionFromFen(KINGS_APART),
			weights: bot.weights,
			search: { ...bot.search, depth },
			temperature: bot.temperature,
			rng: createRng(seed),
		})!
	);
}

describe("the Dodo", () => {
	it.each([0, 1, 2, 3, 4])("marches its king at the other one on seed %i", (seed) => {
		expect(move({ depth: DODO.search.depth, seed })).toBe("a1b2");
	});

	// The one thing its definition is not free to change. `kingProximity` reads the same from
	// either seat, so negamax flips its sign every ply: at an odd depth the Dodo flees instead.
	it("would flee at an odd depth, which is why its depth is even", () => {
		expect(DODO.search.depth % 2).toBe(0);
		expect(move({ depth: 1, seed: 0 })).not.toBe("a1b2");
	});
});
