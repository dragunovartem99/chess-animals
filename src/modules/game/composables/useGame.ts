import type { Chess } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { makeSan } from "chessops/san";
import type { NormalMove } from "chessops/types";
import { computed, ref, shallowRef } from "vue";

import {
	afterMove,
	fenFromPosition,
	type GameStatus,
	gameStatus,
	positionFromFen,
	repetitionKey,
} from "@/shared/chess";
import { toUci } from "@/shared/engine/uci/moves";
import type { PlayedMove } from "@/shared/eval";

export type PlayedTurn = { ply: number; san: string; uci: string };

// One game, owned by the view. The board draws it and the engines are asked about it, but only
// this holds it — so there is exactly one place a move can be applied, and the repetition history
// cannot drift out of step with the position it describes.
export function useGame({ plyLimit = 300 }: { plyLimit?: number } = {}) {
	const position = shallowRef<Chess>(positionFromFen(INITIAL_FEN));
	const keys = ref<string[]>([]);
	const turns = ref<PlayedTurn[]>([]);
	const lastMove = ref<[string, string]>();
	// The move that produced the current position, and the position it came from. The move-level
	// features are the only ones that need to look backwards, and without this they read zero —
	// which makes a checkmate look like an ordinary quiet position.
	const played = shallowRef<PlayedMove>();

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
		lastMove.value = [uci.slice(0, 2), uci.slice(2, 4)];
		played.value = { parent: position.value, move };
		position.value = afterMove({ position: position.value, move });
	}

	function reset(): void {
		position.value = positionFromFen(INITIAL_FEN);
		keys.value = [];
		turns.value = [];
		lastMove.value = undefined;
		played.value = undefined;
	}

	return { position, fen, turns, lastMove, played, status, ply, play, reset };
}
