import { onBeforeUnmount, ref } from "vue";

import { blankPreset, presetFromBot } from "../utils/presets";
import { buildEngine } from "./engine";

// The engine and the settings it was built from, kept in step. Every slider tick and depth change
// reaches the worker as a plain `setoption` line with no restart — routing weight and depth edits
// through UCI is what keeps them live. Only seeding a whole preset rebuilds the engine, which is
// why callers get it through a getter rather than a fixed reference.
export function useSandboxSettings() {
	const starter = blankPreset();
	const weights = ref<Record<string, number>>(starter.weights);
	const depth = ref(starter.depth);
	const quiescence = ref(starter.quiescence);

	let engine = buildEngine(starter);

	function setWeight(key: string, value: number): void {
		// Mutate in place — the ref is deep-reactive, so a slider drag updates one key instead of
		// spreading a fresh ~30-key record (and re-rendering every other slider) per input tick.
		weights.value[key] = value;
		engine.setOption({ name: key, value: String(value) });
	}

	function setDepth(value: number): void {
		depth.value = value;
		engine.setOption({ name: "Depth", value: String(value) });
	}

	function setQuiescence(value: boolean): void {
		quiescence.value = value;
		engine.setOption({ name: "Quiescence", value: String(value) });
	}

	function seedFrom(botId?: string): void {
		const preset = (botId && presetFromBot(botId)) || blankPreset();

		weights.value = preset.weights;
		depth.value = preset.depth;
		quiescence.value = preset.quiescence;
		engine.dispose();
		engine = buildEngine(preset);
	}

	onBeforeUnmount(() => engine.dispose());

	return {
		weights,
		depth,
		quiescence,
		engine: () => engine,
		setWeight,
		setDepth,
		setQuiescence,
		seedFrom,
	};
}
