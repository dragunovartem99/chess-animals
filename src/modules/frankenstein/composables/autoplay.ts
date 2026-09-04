const AUTOPLAY_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

// Runs `step` repeatedly, pausing between moves so a game is watchable rather than instant, until
// `stop()` is called, a step reports nothing happened, or `isOver()` turns true. The loop's exit
// check goes through `isRunning`, a function call rather than a bare variable read, on purpose:
// the token it closes over is reassigned by `start`/`stop`, calls the linter's static
// "loop condition never changes" check cannot see through — which is exactly the point, since
// those calls happen from outside this async function's own frame.
export function createAutoplayLoop({
	step,
	isOver,
}: {
	step: () => Promise<boolean>;
	isOver: () => boolean;
}) {
	let token: symbol | undefined;
	const isRunning = (candidate: symbol) => token === candidate;

	async function run(candidate: symbol): Promise<void> {
		while (isRunning(candidate) && !isOver()) {
			const moved = await step();
			if (!moved) break;
			await delay(AUTOPLAY_DELAY_MS);
		}
		if (isRunning(candidate)) token = undefined;
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
