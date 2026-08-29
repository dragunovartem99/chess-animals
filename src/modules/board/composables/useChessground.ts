import { Chessground } from "chessground";
import type { Api } from "chessground/api";
import type { Config } from "chessground/config";
import { onBeforeUnmount, onMounted, type Ref, ref, watch } from "vue";

// chessground owns its own DOM and mutates it directly. Vue must therefore not re-render inside
// the board's element: the component renders an empty div once, and every update after that goes
// through `api.set` rather than through the template.
export function useChessground({
	element,
	config,
}: {
	element: Ref<HTMLElement | undefined>;
	config: Ref<Config>;
}): Ref<Api | undefined> {
	const api = ref<Api>();

	onMounted(() => {
		if (element.value) api.value = Chessground(element.value, config.value);
	});

	watch(config, (next) => api.value?.set(next), { deep: true });

	onBeforeUnmount(() => {
		api.value?.destroy();
		api.value = undefined;
	});

	return api;
}
