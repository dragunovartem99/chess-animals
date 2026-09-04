import { INITIAL_FEN } from "chessops/fen";
import { afterEach, describe, expect, it, vi } from "vitest";

import { legalMoves } from "@/shared/chess";
import { withSetup } from "@/shared/test-support/component";
import { createTestWorker } from "@/shared/test-support/worker";

import { useSandbox } from "../composables/useSandbox";
import { blankPreset } from "../utils/presets";

function WorkerStub() {
	return createTestWorker();
}

// The engine is a real worker, off the main thread so a search never stalls the board's own move
// animation — a fake `Worker` global stands in for it here, the same as `useBotEngines.test.ts`.
function mount() {
	vi.stubGlobal("Worker", WorkerStub as unknown as typeof Worker);

	return withSetup(() => useSandbox());
}

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("useSandbox", () => {
	it("starts on the opening position with the blank preset", () => {
		const { result } = mount();

		expect(result.game.fen.value).toBe(INITIAL_FEN);
		expect(result.weights.value).toEqual(blankPreset().weights);
		expect(result.depth.value).toBe(blankPreset().depth);
	});

	it("plays one legal move per step, without touching autoplay", async () => {
		const { result } = mount();

		await result.step();

		expect(result.game.ply.value).toBe(1);
		expect(result.autoplay.value).toBe(false);
	});

	it("ignores a step while autoplay is running", async () => {
		const { result } = mount();
		result.toggleAutoplay();

		await result.step();

		expect(result.game.ply.value).toBe(0);
		result.toggleAutoplay();
	});

	it("records a weight change immediately", () => {
		const { result } = mount();

		result.setWeight("materialQueen", 950);

		expect(result.weights.value.materialQueen).toBe(950);
	});

	it("records a depth change immediately", () => {
		const { result } = mount();

		result.setDepth(2);

		expect(result.depth.value).toBe(2);
	});

	it("records a quiescence change immediately", () => {
		const { result } = mount();

		result.setQuiescence(true);

		expect(result.quiescence.value).toBe(true);
	});

	it("seeds from an animal's own weights and depth", () => {
		const { result } = mount();

		result.seedFrom("wolf");

		expect(result.weights.value.swarm).toBe(-180);
		expect(result.depth.value).toBe(3);
	});

	it("seeds back to the blank preset with no id", () => {
		const { result } = mount();
		result.seedFrom("wolf");

		result.seedFrom();

		expect(result.weights.value).toEqual(blankPreset().weights);
		expect(result.depth.value).toBe(blankPreset().depth);
		expect(result.quiescence.value).toBe(blankPreset().quiescence);
	});

	it("clears the board and stops autoplay on reset", () => {
		const { result } = mount();
		result.toggleAutoplay();

		result.reset();

		expect(result.game.fen.value).toBe(INITIAL_FEN);
		expect(result.autoplay.value).toBe(false);
	});

	it("plays moves on its own once autoplay starts, until paused", async () => {
		vi.useFakeTimers();
		const { result } = mount();

		result.toggleAutoplay();
		expect(result.autoplay.value).toBe(true);

		await vi.advanceTimersByTimeAsync(600);
		result.toggleAutoplay();

		expect(result.autoplay.value).toBe(false);
		expect(result.game.ply.value).toBeGreaterThan(0);
	});

	it("answers a human move with one reply of its own", async () => {
		const { result } = mount();
		const move = legalMoves(result.game.position.value)[0];

		await result.playHuman(move);

		expect(result.game.ply.value).toBe(2);
	});

	it("disposes its engine when the view goes away", () => {
		const { unmount } = mount();

		expect(unmount).not.toThrow();
	});
});
