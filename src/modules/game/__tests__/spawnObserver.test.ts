import { afterEach, describe, expect, it, vi } from "vitest";

import { spawnObserver } from "../composables/spawnObserver";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("spawnObserver", () => {
	it("starts the vendored Stockfish in a worker of its own, and ends it on dispose", () => {
		const urls: string[] = [];
		const posted: unknown[] = [];
		const terminate = vi.fn<() => void>();
		vi.stubGlobal("Worker", function WorkerStub(url: string) {
			urls.push(url);

			return {
				postMessage: (line: unknown) => posted.push(line),
				addEventListener: () => undefined,
				terminate,
			};
		});

		const observer = spawnObserver();
		observer.dispose();

		expect(urls).toEqual(["/stockfish/stockfish-19-lite-single.js"]);
		expect(posted).toEqual(["uci"]);
		expect(terminate).toHaveBeenCalledOnce();
	});
});
