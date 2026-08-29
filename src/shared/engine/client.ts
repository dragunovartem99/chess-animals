import { parseResponse } from "./uci/parseResponse";
import { serializeCommand } from "./uci/serialize";
import type { GoLimits, UciResponse } from "./uci/types";

// A line-oriented pipe to something that speaks UCI. A worker is one; an in-process engine used
// by a test is another; `stockfish.wasm`, which already posts UCI lines over `postMessage`, is a
// third and needs no adapter beyond this.
export type UciTransport = {
	send: (line: string) => void;
	subscribe: (handler: (line: string) => void) => void;
	dispose: () => void;
};

export type BestMove = { move: string; score?: number };

// What the arena and the play view talk to. Nothing above this line knows whether the bot is our
// own heuristic search or a real engine.
export type UciEngineClient = {
	init: () => Promise<void>;
	newGame: () => Promise<void>;
	setOption: (option: { name: string; value?: string }) => void;
	setPosition: (position: { fen?: string; moves?: string[] }) => void;
	go: (limits?: GoLimits) => Promise<BestMove>;
	dispose: () => void;
};

// Resolves the first response the predicate accepts. Every UCI exchange has this shape — ask,
// then wait for the one line that ends it — and the engine is free to send any number of `info`
// lines in between.
function createWaiter(transport: UciTransport) {
	const pending: {
		matches: (response: UciResponse) => boolean;
		resolve: (value: UciResponse) => void;
	}[] = [];
	let latestScore: number | undefined;

	transport.subscribe((line) => {
		const response = parseResponse(line);
		if (response.type === "info" && response.score?.kind === "cp")
			latestScore = response.score.value;

		const index = pending.findIndex((entry) => entry.matches(response));
		if (index !== -1) pending.splice(index, 1)[0].resolve(response);
	});

	return {
		await: (matches: (response: UciResponse) => boolean) =>
			new Promise<UciResponse>((resolve) => {
				pending.push({ matches, resolve });
			}),
		takeScore: () => {
			const score = latestScore;
			latestScore = undefined;
			return score;
		},
	};
}

export function createUciClient({ transport }: { transport: UciTransport }): UciEngineClient {
	const waiter = createWaiter(transport);
	const send = (command: Parameters<typeof serializeCommand>[0]) =>
		transport.send(serializeCommand(command));

	return {
		async init() {
			// The wait is registered before the command is sent, never after. A worker answers
			// later, but an in-process engine answers *during* `send`, and a waiter registered
			// afterwards would sit there for a response that had already gone by.
			const acknowledged = waiter.await((response) => response.type === "uciok");
			send({ type: "uci" });
			await acknowledged;

			const ready = waiter.await((response) => response.type === "readyok");
			send({ type: "isready" });
			await ready;
		},
		async newGame() {
			const ready = waiter.await((response) => response.type === "readyok");
			send({ type: "ucinewgame" });
			send({ type: "isready" });
			await ready;
		},
		setOption({ name, value }) {
			send({ type: "setoption", name, value });
		},
		setPosition({ fen, moves = [] }) {
			send({ type: "position", fen, moves });
		},
		async go(limits = {}) {
			const best = waiter.await((candidate) => candidate.type === "bestmove");
			send({ type: "go", limits });
			const response = await best;

			return {
				move: response.type === "bestmove" ? response.move : "0000",
				score: waiter.takeScore(),
			};
		},
		dispose: transport.dispose,
	};
}
