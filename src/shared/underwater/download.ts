// Cache Storage keeps the 23 MB model until the browser needs the space; the HTTP cache may drop it
// in minutes. Keyed by URL, so a new model needs a new file name. A failure only re-downloads.
export async function downloadModel({
	url,
	storage = globalThis.caches,
	fetcher = globalThis.fetch,
}: {
	url: string;
	storage?: CacheStorage;
	fetcher?: typeof fetch;
}): Promise<Uint8Array> {
	const cache = await storage?.open("maia").catch(() => undefined);
	const kept = await cache?.match(url).catch(() => undefined);
	if (kept) return new Uint8Array(await kept.arrayBuffer());

	const response = await fetcher(url);
	if (!response.ok) throw new Error(`Maia's model: ${response.status} from ${url}`);
	await cache?.put(url, response.clone()).catch(() => undefined);
	return new Uint8Array(await response.arrayBuffer());
}
