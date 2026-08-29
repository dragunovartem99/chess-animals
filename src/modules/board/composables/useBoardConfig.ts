import type { Config } from "chessground/config";
import type { Key } from "chessground/types";
import { chessgroundDests } from "chessops/compat";
import { computed, type Ref } from "vue";

import { positionFromFen } from "@/shared/chess";

export type BoardOptions = {
	fen: Ref<string>;
	orientation: Ref<"white" | "black">;
	// Which colours the viewer may move. Empty means a board that only watches.
	playable: Ref<("white" | "black")[]>;
	lastMove: Ref<[Key, Key] | undefined>;
	onMove: (move: { from: Key; to: Key }) => void;
};

// Legal destinations come from chessops rather than from chessground, which knows nothing about
// the rules — it only draws, and asks us what may go where.
export function useBoardConfig(options: BoardOptions) {
	return computed<Config>(() => {
		const position = positionFromFen(options.fen.value);
		const turn = position.turn;
		const movable = options.playable.value.includes(turn);

		return {
			fen: options.fen.value,
			orientation: options.orientation.value,
			turnColor: turn,
			lastMove: options.lastMove.value,
			check: position.isCheck(),
			movable: {
				free: false,
				color: movable ? turn : undefined,
				dests: chessgroundDests(position),
				events: { after: (from: Key, to: Key) => options.onMove({ from, to }) },
			},
			// The board is a view of a game the caller owns: it draws what it is told and reports
			// what was clicked, and never moves a piece on its own authority.
			animation: { enabled: true, duration: 150 },
			draggable: { enabled: movable },
			selectable: { enabled: movable },
			highlight: { lastMove: true, check: true },
		};
	});
}
