import type { NormalMove } from "chessops/types";
import { onBeforeUnmount, ref } from "vue";

import { useGame } from "@/modules/game/composables/useGame";
import { fromUci } from "@/shared/engine/uci/moves";

import { blankPreset, presetFromBot } from "../utils/presets";
import { createAutoplayLoop } from "./autoplay";
import { buildEngine, reseed } from "./engine";

// One weight vector, applied to both colors — the per-animal editor was cut in favour of this
// single live sandbox. The engine runs in a worker (see `engine.ts` for why), but every slider
// tick and depth change still reaches it as a plain `setoption` line with no restart — routing
// weight and depth edits through UCI is what keeps them live.
export function useSandbox() {
	const game = useGame();
	const starter = blankPreset();
	const weights = ref<Record<string, number>>(starter.weights);
	const depth = ref(starter.depth);
	const quiescence = ref(starter.quiescence);
	const autoplay = ref(false);
	const thinking = ref(false);

	let engine = buildEngine({
		weights: weights.value,
		depth: depth.value,
		quiescence: quiescence.value,
	});

	function setWeight(key: string, value: number): void {
		weights.value = { ...weights.value, [key]: value };
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

	async function stepOnce(): Promise<boolean> {
		if (game.status.value.over) return false;

		thinking.value = true;
		try {
			await engine.init();
			engine.setPosition({ fen: game.fen.value });
			const answer = await engine.go({ depth: depth.value });
			const move = fromUci({ position: game.position.value, uci: answer.move });
			if (!move) return false;

			game.play(move);
			return true;
		} finally {
			thinking.value = false;
		}
	}

	// Wraps `stepOnce` so the loop and a lone `step()` call share one place that keeps `autoplay`
	// honest once the game ends mid-run — a checkmating move still finishes stepping before the
	// loop notices there is nothing left to play.
	async function guardedStep(): Promise<boolean> {
		const moved = await stepOnce();
		if (!moved || game.status.value.over) autoplay.value = false;
		return moved;
	}

	const loop = createAutoplayLoop({ step: guardedStep, isOver: () => game.status.value.over });

	function toggleAutoplay(): void {
		if (autoplay.value) {
			loop.stop();
			autoplay.value = false;
			return;
		}

		autoplay.value = true;
		loop.start();
	}

	async function step(): Promise<void> {
		if (!autoplay.value) await stepOnce();
	}

	// A human move gets one reply back, not a takeover of the other side — autoplay is the only
	// mode where the bot plays both colors against itself.
	async function playHuman(move: NormalMove): Promise<void> {
		game.play(move);
		await stepOnce();
	}

	function reset(): void {
		loop.stop();
		autoplay.value = false;
		game.reset();
		reseed(engine);
	}

	onBeforeUnmount(() => engine.dispose());

	return {
		game,
		weights,
		depth,
		quiescence,
		autoplay,
		thinking,
		setWeight,
		setDepth,
		setQuiescence,
		seedFrom,
		step,
		toggleAutoplay,
		reset,
		playHuman,
	};
}
