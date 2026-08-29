import { parseSquare } from "chessops/util";
import { describe, expect, it } from "vitest";

import { chebyshev, frontSpan, passedSpan, relativeRank } from "../families/masks";

describe("frontSpan", () => {
	it("covers a white pawn's own file ahead of it", () => {
		const span = frontSpan({ color: "white", square: parseSquare("d2") });

		expect(span.size()).toBe(6);
		expect(span.has(parseSquare("d3"))).toBe(true);
		expect(span.has(parseSquare("d8"))).toBe(true);
	});

	it("excludes the square itself and everything behind it", () => {
		const span = frontSpan({ color: "white", square: parseSquare("d2") });

		expect(span.has(parseSquare("d2"))).toBe(false);
		expect(span.has(parseSquare("d1"))).toBe(false);
	});

	it("counts the other way for black", () => {
		const span = frontSpan({ color: "black", square: parseSquare("e7") });

		expect(span.size()).toBe(6);
		expect(span.has(parseSquare("e2"))).toBe(true);
		expect(span.has(parseSquare("e8"))).toBe(false);
	});

	it("is empty on the far rank", () => {
		expect(frontSpan({ color: "white", square: parseSquare("h8") }).isEmpty()).toBe(true);
	});
});

describe("passedSpan", () => {
	it("widens the front span onto both neighbouring files", () => {
		const span = passedSpan({ color: "white", square: parseSquare("d4") });

		expect(span.size()).toBe(12);
		expect(span.has(parseSquare("c5"))).toBe(true);
		expect(span.has(parseSquare("e8"))).toBe(true);
		expect(span.has(parseSquare("f5"))).toBe(false);
	});

	it("has only one neighbour on the a file", () => {
		const span = passedSpan({ color: "black", square: parseSquare("a5") });

		expect(span.size()).toBe(8);
		expect(span.has(parseSquare("b1"))).toBe(true);
	});

	it("has only one neighbour on the h file", () => {
		const span = passedSpan({ color: "white", square: parseSquare("h6") });

		expect(span.size()).toBe(4);
		expect(span.has(parseSquare("g7"))).toBe(true);
	});
});

describe("relativeRank", () => {
	it("counts from white's own back rank", () => {
		expect(relativeRank({ color: "white", square: parseSquare("c2") })).toBe(1);
	});

	it("mirrors the board for black", () => {
		expect(relativeRank({ color: "black", square: parseSquare("c7") })).toBe(1);
	});

	it("puts both back ranks at zero", () => {
		expect(relativeRank({ color: "white", square: parseSquare("e1") })).toBe(0);
		expect(relativeRank({ color: "black", square: parseSquare("e8") })).toBe(0);
	});
});

describe("chebyshev", () => {
	it("is zero between a square and itself", () => {
		expect(chebyshev({ from: parseSquare("f3"), to: parseSquare("f3") })).toBe(0);
	});

	it("takes the longer of the two axes", () => {
		expect(chebyshev({ from: parseSquare("a1"), to: parseSquare("c5") })).toBe(4);
	});

	it("costs one step for a diagonal neighbour", () => {
		expect(chebyshev({ from: parseSquare("d4"), to: parseSquare("e5") })).toBe(1);
	});

	it("spans the board corner to corner in seven", () => {
		expect(chebyshev({ from: parseSquare("a1"), to: parseSquare("h8") })).toBe(7);
	});
});
