import { type ShallowRef, shallowRef } from "vue";

import type { WasmEngine } from "./engine";
import { loadEngine } from "./load";

let loading: Promise<WasmEngine> | undefined;

// The page's own engine, for reads that are not a search — the breakdown's features — so they need
// no round trip through a worker. Loaded once, the first time a component asks, and shared by
// every one after; `undefined` until it is ready, which is a frame or two.
export function useWasmEngine(): ShallowRef<WasmEngine | undefined> {
	const engine = shallowRef<WasmEngine>();
	void fill(engine);
	return engine;
}

async function fill(engine: ShallowRef<WasmEngine | undefined>): Promise<void> {
	loading ??= loadEngine();
	engine.value = await loading;
}
