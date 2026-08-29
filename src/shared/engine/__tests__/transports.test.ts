import { describe, expect, it } from "vitest";

import type { BotDefinition } from "../../bots";
import { compileBot } from "../../bots";
import { createTestWorker } from "../../test-support/worker";
import { createUciClient } from "../client";
import { createLocalTransport, createWorkerTransport } from "../transports";

const DONKEY: BotDefinition = {
	id: "donkey",
	search: { depth: 1 },
	temperature: 0,
	weights: { middlegame: { materialPawn: 100, materialKnight: 300 } },
};

function connectOverWorker() {
	const worker = createTestWorker();
	const post = worker.postMessage.bind(worker);
	post({ definition: DONKEY, name: "Test Donkey" });

	return {
		client: createUciClient({ transport: createWorkerTransport({ worker }) }),
		worker,
	};
}

describe("the worker transport", () => {
	it("completes the handshake across the message boundary", async () => {
		const { client } = connectOverWorker();

		await expect(client.init()).resolves.toBeUndefined();
	});

	it("carries a search back as a best move", async () => {
		const { client } = connectOverWorker();
		await client.init();
		client.setPosition({});

		const best = await client.go({ depth: 1 });

		expect(best.move).toMatch(/^[a-h][1-8][a-h][1-8]$/u);
	});

	it("stops delivering lines once disposed", () => {
		const lines: string[] = [];
		const worker = createTestWorker();
		const post = worker.postMessage.bind(worker);
		post({ definition: DONKEY, name: "Test Donkey" });
		const transport = createWorkerTransport({ worker });
		transport.subscribe((line) => lines.push(line));

		transport.dispose();
		transport.send("uci");

		expect(lines).toEqual([]);
	});
});

describe("the local transport", () => {
	it("stops delivering lines once disposed", () => {
		const lines: string[] = [];
		const transport = createLocalTransport({
			config: compileBot(DONKEY),
			name: "Test Donkey",
		});
		transport.subscribe((line) => lines.push(line));

		transport.dispose();
		transport.send("uci");

		expect(lines).toEqual([]);
	});
});
