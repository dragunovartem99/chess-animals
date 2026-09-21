import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { createRng } from "../../engine";
import { maiaMove } from "../maia";
import type { MaiaSession } from "../maia";
import { MOVE_COUNT } from "../vocab";

const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

// A session that likes one index and records what it was asked.
function fakeSession(favourite: number) {
	const asked: number[] = [];
	const session: MaiaSession = {
		ready: () => Promise.resolve(),
		run: ({ elo }) => {
			asked.push(elo);
			const logits = new Float32Array(MOVE_COUNT).fill(-50);
			logits[favourite] = 10;
			return Promise.resolve(logits);
		},
	};
	return { session, asked };
}

describe("maiaMove", () => {
	it("plays the move the model favours, on Maia's flipped board", async () => {
		// e7e5 for Black is e2e4 on the board Maia sees.
		const { session } = fakeSession(12 * 64 + 28);

		const move = await maiaMove({
			session,
			position: positionFromFen(AFTER_E4),
			options: { elo: 1500 },
			rng: createRng(1),
		});

		expect(makeUci(move!)).toBe("e7e5");
	});

	it("asks the model at the animal's rating", async () => {
		const { session, asked } = fakeSession(0);

		await maiaMove({
			session,
			position: positionFromFen(AFTER_E4),
			options: { elo: 1100, greedy: true },
			rng: createRng(1),
		});

		expect(asked).toEqual([1100]);
	});
});
