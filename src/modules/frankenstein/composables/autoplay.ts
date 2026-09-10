const AUTOPLAY_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

// Runs `step` repeatedly, pausing between moves so a game is watchable rather than instant, until
// `stop()` is called, a step reports nothing happened, or `isOver()` turns true. Each move
// schedules the next by recursing rather than looping: moves are sequential by nature, and the
// token check at the top of every call is what lets `start`/`stop` — reassigning it from outside
// this frame — end a run between two moves.
export function createAutoplayLoop({
	step,
	isOver,
}: {
	step: () => Promise<boolean>;
	isOver: () => boolean;
}) {
	let token: symbol | undefined;

	async function run(candidate: symbol): Promise<void> {
		if (token !== candidate) return;

		const moved = !isOver() && (await step());
		if (!moved) {
			if (token === candidate) token = undefined;
			return;
		}
		await delay(AUTOPLAY_DELAY_MS);
		return run(candidate);
	}

	return {
		get active() {
			return token !== undefined;
		},
		start(): void {
			const candidate = Symbol("autoplay");
			token = candidate;
			void run(candidate);
		},
		stop(): void {
			token = undefined;
		},
	};
}
