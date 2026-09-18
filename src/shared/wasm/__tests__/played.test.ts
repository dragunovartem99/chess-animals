import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { loadEngine, playedGame, useWasmEngine } from "..";
import { afterMove, positionFromFen } from "../../chess";
import { extractFeatures, featureId } from "../../eval";

const engine = await loadEngine();
const CAPTURE_VALUE = featureId("captureValue");

describe("playedGame", () => {
	it("is the position alone when no move produced it", () => {
		const fen = "4k3/8/8/8/8/8/8/4K2R w K - 0 1";
		expect(playedGame({ position: positionFromFen(fen) })).toEqual({ fen });
	});

	it("sends castling as the king taking its rook, which the replay accepts", () => {
		const parent = positionFromFen("4k3/8/8/8/8/8/8/4K2R w K - 0 1");
		const move = { from: 4, to: 6 };
		const position = afterMove({ position: parent, move });
		const game = playedGame({ position, played: { parent, move } });

		expect(game.moves).toEqual(["e1h1"]);
		expect(() => engine.extract(game)).not.toThrow();
	});

	it("reads what the TS extractor reads, the move's features included", () => {
		const parent = positionFromFen("4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1");
		const move = { from: 28, to: 35 };
		const position = afterMove({ position: parent, move });
		const played = { parent, move };
		const features = engine.extract(playedGame({ position, played }));

		expect(features).toEqual(extractFeatures({ position, played }));
		expect(features[CAPTURE_VALUE]).toBe(-1);
	});
});

describe("useWasmEngine", () => {
	it("is empty until the engine loads, then shares one instance", async () => {
		const first = useWasmEngine();
		expect(first.value).toBeUndefined();

		await vi.waitFor(() => expect(first.value).toBeDefined());
		const second = useWasmEngine();
		await nextTick();
		await vi.waitFor(() => expect(second.value).toBe(first.value));
	});
});
