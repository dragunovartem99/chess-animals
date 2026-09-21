import { describe, expect, it } from "vitest";

import { figurine } from "../figurine";

describe("figurine", () => {
	it("swaps the leading piece letter for its figurine", () => {
		expect(figurine({ san: "Nf3" })).toBe("♘f3");
		expect(figurine({ san: "Qxd8+" })).toBe("♕xd8+");
		expect(figurine({ san: "Rae1" })).toBe("♖ae1");
	});

	it("swaps a promotion's piece too", () => {
		expect(figurine({ san: "exd8=Q#" })).toBe("exd8=♕#");
	});

	it("leaves pawn moves and castling alone", () => {
		expect(figurine({ san: "exd5" })).toBe("exd5");
		expect(figurine({ san: "O-O-O" })).toBe("O-O-O");
	});

	it("never touches a file letter, b included", () => {
		expect(figurine({ san: "Bxb7" })).toBe("♗xb7");
	});
});
