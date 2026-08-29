import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { afterMove, positionFromFen } from "../../chess";
import { defaultishWeights, onlyWeights } from "../../test-support/weights";
import { chooseMove, scoreMoves } from "../policy";
import { createRng } from "../rng";

const GREEDY = { depth: 1 };

// Total king-distance from every white piece to the black king, measured without going through
// the feature vector, which reports a difference rather than one side's total.
function distanceToBlackKing(position: ReturnType<typeof positionFromFen>): number {
	const king = position.board.kingOf("black")!;
	let total = 0;

	for (const square of position.board.white) {
		total += Math.max(
			Math.abs((square & 7) - (king & 7)),
			Math.abs((square >> 3) - (king >> 3))
		);
	}

	return total;
}

function best({ fen, weights }: { fen: string; weights: ReturnType<typeof onlyWeights> }): string {
	const move = chooseMove({
		position: positionFromFen(fen),
		weights,
		search: GREEDY,
		temperature: 0,
		rng: createRng(1),
	});

	return move ? makeUci(move) : "none";
}

describe("scoreMoves", () => {
	it("scores every legal move", () => {
		const position = positionFromFen(INITIAL_FEN);

		expect(scoreMoves({ position, weights: defaultishWeights(), search: GREEDY })).toHaveLength(
			20
		);
	});

	it("returns nothing when the game is already over", () => {
		const fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

		expect(
			scoreMoves({
				position: positionFromFen(fen),
				weights: defaultishWeights(),
				search: GREEDY,
			})
		).toEqual([]);
	});
});

describe("chooseMove", () => {
	it("takes free material when material is all it values", () => {
		const weights = onlyWeights({ materialQueen: 900, materialPawn: 100 });

		expect(best({ fen: "4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1", weights })).toBe("d1d5");
	});

	it("plays the mate when it values mate, from the same position as a bot that will not", () => {
		const fen = "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1";

		expect(best({ fen, weights: onlyWeights({ givesMate: 100000 }) })).toBe("a1a8");
		expect(
			best({ fen, weights: onlyWeights({ givesMate: -100000, materialPawn: 1 }) })
		).not.toBe("a1a8");
	});

	it("closes on the enemy king when it is a swarm bot", () => {
		const weights = onlyWeights({ swarm: -10 });
		// A queen rather than a rook: from a1 every rook move is the same Chebyshev distance from
		// h8, so that position is a plateau the paper describes — nothing to close, and the bot
		// shuffles along the local maximum. The queen has the long diagonal.
		const position = positionFromFen("8/7k/8/8/8/8/8/Q3K3 w - - 0 1");
		const move = chooseMove({
			position,
			weights,
			search: GREEDY,
			temperature: 0,
			rng: createRng(1),
		})!;

		// Which piece it charges with is up to it — the paper's swarm counts the king too. What
		// must hold is that White's army ends up nearer the black king than it started.
		expect(distanceToBlackKing(afterMove({ position, move }))).toBeLessThan(
			distanceToBlackKing(position)
		);
	});
});

describe("chooseMove edge cases", () => {
	it("returns undefined when there are no legal moves", () => {
		const fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
		const position = positionFromFen(fen);

		expect(
			chooseMove({
				position,
				weights: defaultishWeights(),
				search: GREEDY,
				temperature: 0,
				rng: createRng(1),
			})
		).toBeUndefined();
	});
});
