import { onBeforeUnmount, watch } from "vue";
import type { Ref } from "vue";

import { createWorkerTransport } from "@/shared/engine";
import { createStockfish } from "@/shared/monsters";
import { createObserver } from "@/shared/talk";
import type { Observer } from "@/shared/talk";

// The same vendored build the monsters play on, in a worker of its own: the observer must not
// share a Stockfish with a monster that is playing, and the monster's lives inside the bot's worker.
const STOCKFISH_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`;

export function spawnObserver(): Observer {
	const worker = new Worker(STOCKFISH_URL);

	return createObserver({
		stockfish: createStockfish({ transport: createWorkerTransport({ worker }) }),
	});
}

// An observer for as long as `enabled` holds: spawned when it turns on, ended when it turns off
// or the view goes. Watching before any other watcher on `enabled`, so theirs find it in place.
export function useObserver({ enabled, spawn }: { enabled: Ref<boolean>; spawn: () => Observer }) {
	let observer: Observer | undefined;

	watch(
		enabled,
		(on) => {
			observer?.dispose();
			observer = on ? spawn() : undefined;
		},
		{ immediate: true }
	);
	onBeforeUnmount(() => observer?.dispose());

	return () => observer;
}
