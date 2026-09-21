import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it, vi } from "vitest";

import { compileBot } from "../../bots";
import { positionFromFen } from "../../chess";
import { seedState } from "../../engine";
import type { GoRequest, GoResult } from "../../engine";
import type { MaiaSession } from "../maia";
import { withMaia } from "../mover";
import { MOVE_COUNT } from "../vocab";

const E2E4 = 12 * 64 + 28;
const bot = compileBot({ id: "owl", search: { depth: 1 }, weights: {} });
const request: GoRequest = {
	game: { position: positionFromFen(INITIAL_FEN), fen: INITIAL_FEN, moves: [] },
	weights: bot.weights,
	search: bot.search,
	rngState: seedState("s"),
};

const session: MaiaSession = {
	ready: () => Promise.resolve(),
	run: () => {
		const logits = new Float32Array(MOVE_COUNT).fill(-50);
		logits[E2E4] = 10;
		return Promise.resolve(logits);
	},
};

function setup(maia?: MaiaSession) {
	const next = vi.fn<(req: GoRequest) => Promise<GoResult>>((req) =>
		Promise.resolve<GoResult>({ move: { from: 8, to: 16 }, score: 7, rngState: req.rngState })
	);
	return { next, move: withMaia({ next, session: maia }) };
}

describe("withMaia", () => {
	it("hands a bot without maia on, untouched", async () => {
		const { next, move } = setup(session);

		const found = await move(request);

		expect(next).toHaveBeenCalledOnce();
		expect(found.score).toBe(7);
	});

	it("asks Maia for an underwater animal, and never the next mover", async () => {
		const { next, move } = setup(session);

		const found = await move({ ...request, maia: { elo: 1500 } });

		expect(makeUci(found.move!)).toBe("e2e4");
		expect(next).not.toHaveBeenCalled();
	});

	it("hands the stream back advanced by the one draw", async () => {
		const { move } = setup(session);

		const found = await move({ ...request, maia: { elo: 1500 } });

		expect(found.rngState).not.toEqual(request.rngState);
	});

	it("refuses an underwater animal when there is no Maia to ask", async () => {
		const { move } = setup();

		await expect(move({ ...request, maia: { elo: 1500 } })).rejects.toThrow("needs Maia");
	});
});
