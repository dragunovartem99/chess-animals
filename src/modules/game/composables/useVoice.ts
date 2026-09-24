import { watch } from "vue";
import type { Ref } from "vue";

import { clipPath } from "@/shared/talk";
import type { Line } from "@/shared/talk";
import { useStoredFlag } from "@/shared/ui";

// What playing a clip needs from an `<audio>`: a test hands in a fake.
export type Player = {
	play: () => Promise<void>;
	pause: () => void;
	onDone: (done: () => void) => void;
};

function audioPlayer(url: string): Player {
	const audio = new Audio(url);

	return {
		play: () => audio.play(),
		pause: () => audio.pause(),
		// A clip that will not load — an animal nobody has recorded yet — ends as quietly as one
		// that played, so the next one still gets its turn.
		onDone: (done) => {
			audio.addEventListener("ended", done);
			audio.addEventListener("error", done);
		},
	};
}

// The remarks read aloud, opt-in on top of the talk. What was said together plays in turn — both
// greetings, both goodbyes — and a new remark cuts off whatever is still playing rather than wait
// behind it, since by then the old one is about a move nobody is looking at.
export function useVoice({
	said,
	locale,
	player = audioPlayer,
}: {
	said: Ref<Line[]>;
	locale: Ref<string>;
	player?: (url: string) => Player;
}) {
	const enabled = useStoredFlag("chess-animals:voices");
	let playing: Player | undefined;
	let heard = 0;

	function stop() {
		playing?.pause();
		playing = undefined;
	}

	function playFrom(lines: Line[]) {
		const [line, ...rest] = lines;
		if (!line) return;

		const next = player(
			`${import.meta.env.BASE_URL}${clipPath({ ...line, locale: locale.value })}`
		);
		playing = next;
		next.onDone(() => playing === next && playFrom(rest));
		next.play().catch(() => playing === next && playFrom(rest));
	}

	watch(said, (lines) => {
		const fresh = lines.filter((line) => line.key > heard);
		heard = Math.max(heard, ...lines.map((line) => line.key));
		if (!enabled.value || fresh.length === 0) return;

		stop();
		playFrom(fresh);
	});
	watch(enabled, (on) => on || stop());

	return enabled;
}
