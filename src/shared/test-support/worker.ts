import { compileBot, type BotDefinition } from "../bots";
import { parseCommand } from "../engine/uci/parseCommand";
import { serializeResponse } from "../engine/uci/serialize";
import { createUciEngine } from "../engine/uciEngine";

// The `uciEngine` worker without a thread: the same first-message-is-the-bot protocol, delivering
// responses to its listeners synchronously. It is what lets a test drive `createWorkerTransport`
// and the composables above it without spawning anything.
export function createTestWorker(): Worker {
	const listeners: ((event: MessageEvent<string>) => void)[] = [];
	let engine: ReturnType<typeof createUciEngine> | undefined;

	return {
		postMessage: (data: string | { definition: BotDefinition; name: string }) => {
			if (typeof data !== "string") {
				engine = createUciEngine({
					config: compileBot(data.definition),
					name: data.name,
				});
				return;
			}
			if (!engine) return;

			for (const response of engine.handle(parseCommand(data))) {
				const event = { data: serializeResponse(response) } as MessageEvent<string>;
				for (const listener of listeners) listener(event);
			}
		},
		addEventListener: (_type: string, handler: (event: MessageEvent<string>) => void) => {
			listeners.push(handler);
		},
		terminate: () => {
			listeners.length = 0;
		},
	} as unknown as Worker;
}
