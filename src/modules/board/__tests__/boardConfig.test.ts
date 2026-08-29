import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";
import { ref } from "vue";

import { useBoardConfig } from "../composables/useBoardConfig";

function build({ fen = INITIAL_FEN, playable = [] as ("white" | "black")[] } = {}) {
	return useBoardConfig({
		fen: ref(fen),
		orientation: ref("white"),
		playable: ref(playable),
		lastMove: ref(undefined),
		onMove: () => {},
	});
}

describe("useBoardConfig", () => {
	it("tells chessground whose turn it is", () => {
		expect(build().value.turnColor).toBe("white");
		expect(build({ fen: "4k3/8/8/8/8/8/8/4K3 b - - 0 1" }).value.turnColor).toBe("black");
	});

	it("offers the legal destinations, which chessground does not know", () => {
		const dests = build().value.movable?.dests;

		expect(dests?.get("e2")).toEqual(["e3", "e4"]);
		expect(dests?.get("b1")).toEqual(["a3", "c3"]);
	});

	it("lets the viewer move only the colours it was given", () => {
		expect(build({ playable: ["white"] }).value.movable?.color).toBe("white");
		expect(build({ playable: ["black"] }).value.movable?.color).toBeUndefined();
		expect(build().value.movable?.color).toBeUndefined();
	});

	it("locks dragging on a board nobody may move", () => {
		expect(build().value.draggable?.enabled).toBe(false);
		expect(build({ playable: ["white"] }).value.draggable?.enabled).toBe(true);
	});

	it("never lets a piece be dropped on a square the rules forbid", () => {
		expect(build({ playable: ["white"] }).value.movable?.free).toBe(false);
	});

	it("flags check so the board can show it", () => {
		expect(build().value.check).toBe(false);
		expect(build({ fen: "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1" }).value.check).toBe(true);
	});

	it("offers both squares for castling, so the rook-square form works too", () => {
		const dests = build({ fen: "4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1" }).value.movable?.dests;

		expect(dests?.get("e1")).toEqual(expect.arrayContaining(["g1", "h1", "c1", "a1"]));
	});
});
