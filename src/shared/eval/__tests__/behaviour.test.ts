import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("swarm", () => {
	it("is level in the symmetric opening position", () => {
		expect(read({ fen: INITIAL_FEN, key: "swarm" })).toBe(0);
	});

	it("falls as our pieces close on the enemy king, which a negative weight rewards", () => {
		const far = read({ fen: "7k/8/8/8/8/8/8/R3K3 w - - 0 1", key: "swarm" });
		const near = read({ fen: "7k/6R1/8/8/8/8/8/4K3 w - - 0 1", key: "swarm" });

		expect(near).toBeLessThan(far);
	});
});

describe("huddle", () => {
	it("falls as our pieces gather around our own king", () => {
		const scattered = read({ fen: "7k/8/8/8/8/8/8/R3K3 w - - 0 1", key: "huddle" });
		const gathered = read({ fen: "7k/8/8/8/8/8/8/3RK3 w - - 0 1", key: "huddle" });

		expect(gathered).toBeLessThan(scattered);
	});
});

describe("kingProximity", () => {
	it("is the plain distance between the kings, identical from either side", () => {
		const white = read({ fen: "7k/8/8/8/8/8/8/K7 w - - 0 1", key: "kingProximity" });
		const black = read({ fen: "7k/8/8/8/8/8/8/K7 b - - 0 1", key: "kingProximity" });

		expect(white).toBe(7);
		expect(black).toBe(7);
	});

	it("shrinks as the kings walk together", () => {
		expect(read({ fen: "8/8/3k4/8/3K4/8/8/8 w - - 0 1", key: "kingProximity" })).toBe(2);
	});
});

describe("sameColorSquares", () => {
	it("counts our pieces standing on squares of our own colour", () => {
		// White's rook is on h1, a light square. Black's king is on g8, also light, so it does
		// not count for Black, whose colour is dark.
		expect(read({ fen: "6k1/8/8/8/8/8/8/K6R w - - 0 1", key: "sameColorSquares" })).toBe(1);
	});

	it("does not count a piece sitting on the other colour", () => {
		expect(read({ fen: "6k1/8/8/8/8/8/8/K7 w - - 0 1", key: "sameColorSquares" })).toBe(0);
	});
});

describe("symmetry", () => {
	it("scores the opening position as perfectly mirrored across the ranks", () => {
		expect(read({ fen: INITIAL_FEN, key: "symmetryMirrorY" })).toBeCloseTo(0);
	});

	it("penalises a board that has lost its mirror", () => {
		expect(
			read({
				fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN1 w Qkq - 0 1",
				key: "symmetryMirrorY",
			})
		).toBeLessThan(0);
	});

	it("reads the same for both sides, being a property of the whole board", () => {
		const fen = "4k3/8/8/8/8/8/8/4K3";

		expect(read({ fen: `${fen} w - - 0 1`, key: "symmetryRot180" })).toBe(
			read({ fen: `${fen} b - - 0 1`, key: "symmetryRot180" })
		);
	});
});

describe("opponentMobility", () => {
	it("counts what the other side can reach, and nothing of ours", () => {
		const boxedIn = read({ fen: "7k/8/8/8/8/8/8/K7 w - - 0 1", key: "opponentMobility" });
		const active = read({ fen: "7k/8/8/3q4/8/8/8/K7 w - - 0 1", key: "opponentMobility" });

		expect(active).toBeGreaterThan(boxedIn);
	});
});

describe("pushDepth", () => {
	it("ignores everything that has not crossed the halfway line", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/3R4/4K3 w - - 0 1", key: "pushDepth" })).toBe(0);
	});

	it("grows the deeper a piece goes", () => {
		const fifth = read({ fen: "4k3/8/8/3R4/8/8/8/4K3 w - - 0 1", key: "pushDepth" });
		const seventh = read({ fen: "4k3/3R4/8/8/8/8/8/4K3 w - - 0 1", key: "pushDepth" });

		expect(fifth).toBe(1);
		expect(seventh).toBe(3);
	});
});

describe("offeredMaterial", () => {
	it("is zero when nothing of ours is attacked", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/8/4K2R w - - 0 1", key: "offeredMaterial" })).toBe(0);
	});

	it("prices what the opponent can take from us", () => {
		expect(read({ fen: "4k3/8/8/8/8/4K3/8/1q4N1 w - - 0 1", key: "offeredMaterial" })).toBe(3);
	});

	it("counts a piece once for every way it can be taken", () => {
		expect(read({ fen: "4k1r1/8/8/8/8/4K3/8/1q4N1 w - - 0 1", key: "offeredMaterial" })).toBe(
			6
		);
	});
});
