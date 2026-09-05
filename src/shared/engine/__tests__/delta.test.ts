import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { onlyWeights } from "../../test-support/weights";
import { captureWorth } from "../delta";
import { searchRoot } from "../search";

const MATERIAL = onlyWeights({
	materialPawn: 100,
	materialKnight: 320,
	materialBishop: 330,
	materialRook: 500,
	materialQueen: 900,
});

function bestMove({ fen, weights = MATERIAL }: { fen: string; weights?: typeof MATERIAL }): string {
	const { scored } = searchRoot({
		position: positionFromFen(fen),
		weights,
		options: { depth: 3, quiescence: true },
	});
	const best = scored.reduce((left, right) => (right.score > left.score ? right : left));

	return makeUci(best.move);
}

describe("captureWorth", () => {
	it("prices a capture at the bot's own piece values", () => {
		const worth = captureWorth(MATERIAL);

		expect(worth.pawn).toBe(100);
		expect(worth.queen).toBe(900);
	});

	it("counts what a bot pays for the act of capturing on top of the piece", () => {
		const worth = captureWorth(onlyWeights({ materialPawn: 100, captureValue: 50 }));

		// A pawn is worth its hundred, plus fifty a classical pawn for having been taken at all.
		expect(worth.pawn).toBe(150);
	});

	it("bounds a bot that weighs nothing a capture can move at zero", () => {
		expect(captureWorth(onlyWeights({ swarm: -180 })).queen).toBe(0);
	});

	it("prices a capture the same whichever way the weight points", () => {
		// A bot paid to shed material gains by being taken, so the bound has to be optimistic in
		// both directions or its own lines would be the ones pruned.
		expect(captureWorth(onlyWeights({ materialQueen: -900 })).queen).toBe(900);
	});

	it("never prunes on the king, which is not taken", () => {
		expect(captureWorth(MATERIAL).king).toBe(Infinity);
	});
});

describe("a quiescence that prunes hopeless captures", () => {
	// The tactic the extension exists for: Ra8+ is a back-rank check whose only answer is the
	// queen, and pruning must not cost it. Material is level going in, so nothing is hopeless.
	it("still wins the queen for a rook on the back rank", () => {
		expect(bestMove({ fen: "6k1/5ppp/3q4/8/8/8/5PPP/R5K1 w - - 0 1" })).toBe("a1a8");
	});

	// Rxa7 loses the rook to the recapture, which is exactly what quiescence is there to see.
	// White is level going in, so the pawn is nowhere near hopeless and the line is searched.
	it("still declines a poisoned pawn", () => {
		const fen = "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1";

		expect(bestMove({ fen })).not.toBe("a1a7");
	});

	it("plays on for a bot no capture can score", () => {
		// Every capture is hopeless by the bound, because the bot counts none of them — and it
		// still has to come back with a legal move.
		const move = bestMove({
			fen: "6k1/5ppp/3q4/8/8/8/5PPP/R5K1 w - - 0 1",
			weights: onlyWeights({ swarm: -180 }),
		});

		expect(move).toMatch(/^[a-h][1-8][a-h][1-8]$/u);
	});
});
