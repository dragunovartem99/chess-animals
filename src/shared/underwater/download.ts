// The model's bytes, from the browser's Cache Storage when an earlier visit already fetched them.
// The HTTP cache alone keeps 23 MB for as long as the host's `max-age` says, often minutes; this
// keeps it until the browser needs the space back. Keyed by URL, so a new model must ship under a
// new file name — as the int8 one did — or players keep the old one.
//
// Best effort throughout: no Cache Storage (an insecure origin), a quota error or a failed write
// only means the next visit downloads again, never that a game cannot start.
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
