import { ref } from "vue";
import type { Ref } from "vue";

import type { UciEngineClient } from "@/shared/engine";
import { fromUci } from "@/shared/engine/uci/moves";
import type { useGame } from "@/shared/game";

// One engine move on the live game, flagging `thinking` while the worker searches. Reports
// whether a move was actually played, so autoplay knows when to stop.
export function useEngineMove({
	game,
	engine,
	depth,
}: {
	game: ReturnType<typeof useGame>;
	engine: () => UciEngineClient;
	depth: Ref<number>;
}) {
	const thinking = ref(false);

	async function stepOnce(): Promise<boolean> {
		if (game.status.value.over) return false;

		thinking.value = true;
		try {
			const client = engine();
			await client.init();
			client.setPosition({ fen: game.fen.value });
			const answer = await client.go({ depth: depth.value });
			const move = fromUci({ position: game.position.value, uci: answer.move });
			if (!move) return false;

			game.play(move);
			return true;
		} finally {
			thinking.value = false;
		}
	}

	return { thinking, stepOnce };
}
