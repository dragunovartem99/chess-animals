import type { NormalMove } from "chessops/types";
import { ref } from "vue";

import { useGame } from "@/shared/game";

import { createAutoplayLoop } from "./autoplay";
import { reseed } from "./engine";
import { useEngineMove } from "./useEngineMove";
import { useSandboxSettings } from "./useSandboxSettings";

// One weight vector, applied to both colors — the per-animal editor was cut in favour of this
// single live sandbox. The engine runs in a worker (see `engine.ts` for why); its settings live in
// `useSandboxSettings`, and this composable owns only who moves when.
export function useSandbox() {
	const game = useGame();
	const { engine, ...settings } = useSandboxSettings();
	const { thinking, stepOnce } = useEngineMove({ game, engine, depth: settings.depth });
	const autoplay = ref(false);

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
		reseed(engine());
	}

	return { game, ...settings, autoplay, thinking, step, toggleAutoplay, reset, playHuman };
}
