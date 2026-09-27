import { describe, expect, it } from "vitest";
import { nextTick, ref } from "vue";

import type { Line } from "@/shared/talk";
import { withSetup } from "@/shared/test-support/component";

import { useVoice } from "../composables/useVoice";
import type { Player } from "../composables/useVoice";

const line = (key: number, id: string, remark: Line["remark"] = "greet"): Line => ({
	key,
	id,
	remark,
	index: 0,
	color: "white",
});

// Players that remember what they were asked to play, and finish when the test says.
function fakePlayers() {
	const played: string[] = [];
	const paused: string[] = [];
	const finish: (() => void)[] = [];
	const player = (url: string): Player => ({
		play: () => {
			played.push(url);
			return Promise.resolve();
		},
		pause: () => paused.push(url),
		onDone: (done) => finish.push(done),
	});

	return { player, played, paused, finish };
}

function mount() {
	const said = ref<Line[]>([]);
	const locale = ref("en");
	const players = fakePlayers();
	const { result: enabled } = withSetup(() => useVoice({ said, locale, player: players.player }));

	return { said, locale, enabled, ...players };
}

describe("useVoice", () => {
	it("stays silent until switched on", async () => {
		const { said, played } = mount();

		said.value = [line(1, "wolf")];
		await nextTick();

		expect(played).toEqual([]);
	});

	it("plays what was said together in turn, in the page's language", async () => {
		const { said, locale, enabled, played, finish } = mount();
		enabled.value = true;
		locale.value = "ru";

		said.value = [line(1, "wolf"), line(2, "fox")];
		await nextTick();
		expect(played).toEqual(["/voice/ru/wolf/greet-0.mp3"]);

		finish[0]!();
		expect(played).toEqual(["/voice/ru/wolf/greet-0.mp3", "/voice/ru/fox/greet-0.mp3"]);
	});

	it("cuts off an old remark for a new one, and stops when switched off", async () => {
		const { said, enabled, played, paused, finish } = mount();
		enabled.value = true;
		said.value = [line(1, "wolf")];
		await nextTick();

		said.value = [line(1, "wolf"), line(2, "wolf", "check")];
		await nextTick();
		finish[0]!();
		enabled.value = false;
		await nextTick();

		expect(played).toEqual(["/voice/en/wolf/greet-0.mp3", "/voice/en/wolf/check-0.mp3"]);
		expect(paused).toEqual(["/voice/en/wolf/greet-0.mp3", "/voice/en/wolf/check-0.mp3"]);
	});
});
