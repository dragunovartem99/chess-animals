import { describe, expect, it } from "vitest";

import { downloadModel } from "../download";

const URL = "/maia3/model.onnx";

// A Cache Storage with one cache in memory, enough for what `downloadModel` asks of it.
function memoryStorage() {
	const kept = new Map<string, Response>();
	const cache = {
		match: (url: string) => Promise.resolve(kept.get(url)?.clone()),
		put: (url: string, response: Response) => {
			kept.set(url, response);
			return Promise.resolve();
		},
	};
	return { storage: { open: () => Promise.resolve(cache) } as unknown as CacheStorage, kept };
}

function countingFetch(status = 200) {
	const calls: string[] = [];
	const fetcher = ((url: string) => {
		calls.push(url);
		return Promise.resolve(new Response(Uint8Array.of(1, 2, 3), { status }));
	}) as typeof fetch;
	return { fetcher, calls };
}

describe("downloadModel", () => {
	it("downloads once, then reads the bytes back from the cache", async () => {
		const { storage } = memoryStorage();
		const { fetcher, calls } = countingFetch();

		expect(await downloadModel({ url: URL, storage, fetcher })).toEqual(Uint8Array.of(1, 2, 3));
		expect(await downloadModel({ url: URL, storage, fetcher })).toEqual(Uint8Array.of(1, 2, 3));
		expect(calls).toEqual([URL]);
	});

	it("still downloads without Cache Storage", async () => {
		const { fetcher, calls } = countingFetch();
		const storage = undefined as unknown as CacheStorage;

		await downloadModel({ url: URL, storage, fetcher });
		await downloadModel({ url: URL, storage, fetcher });
		expect(calls).toHaveLength(2);
	});

	it("still downloads when the cache cannot be opened", async () => {
		const { fetcher } = countingFetch();
		const storage = {
			open: () => Promise.reject(new Error("denied")),
		} as unknown as CacheStorage;

		expect(await downloadModel({ url: URL, storage, fetcher })).toEqual(Uint8Array.of(1, 2, 3));
	});

	it("keeps no failed response and says what failed", async () => {
		const { storage, kept } = memoryStorage();
		const { fetcher } = countingFetch(404);

		await expect(downloadModel({ url: URL, storage, fetcher })).rejects.toThrow(/404/u);
		expect(kept.size).toBe(0);
	});
});
