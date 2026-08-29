import { compileBot } from "@/shared/bots";
import type { BotDefinition } from "@/shared/bots";
import { parseCommand } from "@/shared/engine/uci/parseCommand";
import { serializeResponse } from "@/shared/engine/uci/serialize";
import { createUciEngine } from "@/shared/engine/uciEngine";

// The worker is deliberately almost empty: it owns a bot and a pipe, and everything it does with
// them is in `createUciEngine`, where it can be tested without spawning anything.
//
// The first message must be the bot definition; every message after it is a UCI line.
let engine: ReturnType<typeof createUciEngine> | undefined;

// See `createWorkerTransport`: a worker's `postMessage` has no target-origin argument.
const post = self.postMessage.bind(self);

self.addEventListener(
	"message",
	(event: MessageEvent<string | { definition: BotDefinition; name: string }>) => {
		if (typeof event.data !== "string") {
			engine = createUciEngine({
				config: compileBot(event.data.definition),
				name: event.data.name,
			});
			return;
		}

		if (!engine) return;

		for (const response of engine.handle(parseCommand(event.data))) {
			post(serializeResponse(response));
		}
	}
);
