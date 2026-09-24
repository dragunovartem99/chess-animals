import { COLORS } from "chessops/types";
import type { Color } from "chessops/types";
import type { Ref } from "vue";

import { createRng } from "@/shared/engine";
import { pauseFor } from "@/shared/talk";

const sleep = (ms: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});

// The wait before a bot's move. Two bots answer each other in milliseconds, and a game over before
// anyone can follow it is not worth watching, so they take a while; a human is never kept waiting.
export function usePace({
	players,
	isBot,
	seed = () => crypto.randomUUID(),
}: {
	players: Ref<Record<Color, string>>;
	isBot: (id: string) => boolean;
	seed?: () => string;
}): () => Promise<void> {
	const rng = createRng(seed());

	return () =>
		COLORS.every((color) => isBot(players.value[color]))
			? sleep(pauseFor(rng))
			: Promise.resolve();
}
