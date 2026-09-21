import { describe, expect, it } from "vitest";
import { ref } from "vue";

import type { PlayedTurn } from "@/shared/game";

import { useHistory } from "../composables/useHistory";

// A game of `ply` moves, e2e4 every time: the history only counts them and reads their squares.
function game(ply: number) {
	const turns = ref<PlayedTurn[]>([]);
	const fens = ref<string[]>(["start"]);
	const play = (count: number) => {
		for (let index = 0; index < count; index += 1) {
			turns.value = [...turns.value, { ply: turns.value.length + 1, san: "e4", uci: "e2e4" }];
			fens.value = [...fens.value, `after ${turns.value.length}`];
		}
	};
	play(ply);
	return { turns, fens, play };
}

describe("useHistory", () => {
	it("follows the game until the player steps back", () => {
		const { turns, fens, play } = game(3);
		const history = useHistory({ turns, fens });

		play(1);
		expect(history.viewed.value).toBe(4);
		expect(history.fen.value).toBe("after 4");

		history.previous();
		play(1);
		expect(history.viewed.value).toBe(3);
		expect(history.fen.value).toBe("after 3");
		expect(history.live.value).toBe(false);
	});

	it("follows again once stepped onto the last ply", () => {
		const { turns, fens, play } = game(2);
		const history = useHistory({ turns, fens });

		history.first();
		expect(history.viewed.value).toBe(0);
		expect(history.lastMove.value).toBeUndefined();

		history.next();
		expect(history.lastMove.value).toEqual(["e2", "e4"]);
		history.next();
		play(1);
		expect(history.live.value).toBe(true);
		expect(history.viewed.value).toBe(3);
	});

	it("clamps to the game's ends", () => {
		const history = useHistory(game(2));

		history.goTo(-4);
		expect(history.viewed.value).toBe(0);
		history.previous();
		expect(history.viewed.value).toBe(0);

		history.goTo(9);
		expect(history.live.value).toBe(true);
	});
});
