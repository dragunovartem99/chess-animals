import type { Chess } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { makeSan } from "chessops/san";
import type { NormalMove } from "chessops/types";
import { computed, ref, shallowRef } from "vue";

import { afterMove, fenFromPosition, gameStatus, positionFromFen, repetitionKey } from "../chess";
import type { GameStatus } from "../chess";
import { toUci } from "../engine/uci/moves";

export type PlayedTurn = { ply: number; san: string; uci: string };

// One game, owned by the view. The board draws it and the engines are asked about it, but only
// this holds it — so there is exactly one place a move can be applied, and the repetition history
// cannot drift out of step with the position it describes.
export function useGame({ plyLimit = 300 }: { plyLimit?: number } = {}) {
	const position = shallowRef<Chess>(positionFromFen(INITIAL_FEN));
	const keys = ref<string[]>([]);
	const turns = ref<PlayedTurn[]>([]);
	// The position after every ply, the opening one first, so the board can show any point of the
	// game without replaying it from the start.
	const fens = ref<string[]>([INITIAL_FEN]);

	const fen = computed(() => fenFromPosition(position.value));
	const ply = computed(() => turns.value.length);
	const status = computed<GameStatus>(() =>
		gameStatus({ position: position.value, keys: keys.value, plyLimit, ply: ply.value })
	);

	function play(move: NormalMove): void {
		if (status.value.over) return;

		const uci = toUci({ position: position.value, move });
		// SAN has to be made before the move is played: it names the piece and the disambiguation
		// from the position the move was played *from*.
		const san = makeSan(position.value, move);

		keys.value = [...keys.value, repetitionKey(position.value)];
		turns.value = [...turns.value, { ply: ply.value + 1, san, uci }];
		position.value = afterMove({ position: position.value, move });
		fens.value = [...fens.value, fenFromPosition(position.value)];
	}

	function reset(): void {
		position.value = positionFromFen(INITIAL_FEN);
		keys.value = [];
		turns.value = [];
		fens.value = [INITIAL_FEN];
	}

	return { position, fen, fens, turns, status, ply, play, reset };
}
