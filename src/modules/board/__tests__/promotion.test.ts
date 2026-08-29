import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { isPromotionMove } from "../utils/promotion";

describe("isPromotionMove", () => {
	it("recognises a white pawn reaching the eighth rank", () => {
		expect(
			isPromotionMove({ fen: "7k/3P4/8/8/8/8/8/4K3 w - - 0 1", from: "d7", to: "d8" })
		).toBe(true);
	});

	it("recognises a black pawn reaching the first rank", () => {
		expect(
			isPromotionMove({ fen: "4k3/8/8/8/8/8/3p4/7K b - - 0 1", from: "d2", to: "d1" })
		).toBe(true);
	});

	it("does not fire for a pawn moving anywhere else", () => {
		expect(isPromotionMove({ fen: INITIAL_FEN, from: "e2", to: "e4" })).toBe(false);
	});

	it("does not fire for a piece reaching the last rank", () => {
		expect(
			isPromotionMove({ fen: "7k/8/8/8/8/8/8/R3K3 w Q - 0 1", from: "a1", to: "a8" })
		).toBe(false);
	});

	it("does not fire for a black pawn reaching the eighth rank, which it never can", () => {
		expect(
			isPromotionMove({ fen: "4k3/8/8/8/8/8/3p4/7K b - - 0 1", from: "d2", to: "d8" })
		).toBe(false);
	});

	it("is false for an empty square rather than throwing", () => {
		expect(isPromotionMove({ fen: INITIAL_FEN, from: "e4", to: "e8" })).toBe(false);
	});
});
