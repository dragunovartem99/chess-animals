import type { Key } from "chessground/types";
import { computed, ref } from "vue";
import type { Ref } from "vue";

import type { PlayedTurn } from "@/shared/game";

// Which ply the board shows. Unpinned, it follows the game and every move lands on screen as it is
// played; stepping back pins it, and stepping onto the last ply unpins it again — so a move that
// arrives while the player is reading an earlier one does not yank the board away from them.
export function useHistory({ fens, turns }: { fens: Ref<string[]>; turns: Ref<PlayedTurn[]> }) {
	const pinned = ref<number>();
	const ply = computed(() => turns.value.length);

	const viewed = computed(() => pinned.value ?? ply.value);
	const live = computed(() => pinned.value === undefined);

	const fen = computed(() => fens.value[viewed.value]);
	const lastMove = computed(() => {
		const uci = turns.value[viewed.value - 1]?.uci;
		return uci ? ([uci.slice(0, 2), uci.slice(2, 4)] as [Key, Key]) : undefined;
	});

	function goTo(target: number): void {
		const clamped = Math.min(Math.max(target, 0), ply.value);
		pinned.value = clamped === ply.value ? undefined : clamped;
	}

	return {
		viewed,
		live,
		fen,
		lastMove,
		goTo,
		first: () => goTo(0),
		previous: () => goTo(viewed.value - 1),
		next: () => goTo(viewed.value + 1),
		last: () => goTo(ply.value),
	};
}
