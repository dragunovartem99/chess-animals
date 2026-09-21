import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { STOCKFISH_WASM_URL } from "../sea/process";
import { ENGINE_URL } from "../wasm";
import type { GameReport, GameSpec } from "./types";

// The first bytes of the vendored Stockfish's digest, read once.
let stockfishBuild: string | undefined;
function stockfishDigest(): string {
	stockfishBuild ??= createHash("sha256")
		.update(readFileSync(STOCKFISH_WASM_URL))
		.digest("hex")
		.slice(0, 16);
	return stockfishBuild;
}

// A stable JSON string: object keys sorted at every level, so two specs that differ only in
// property order hash the same.
function canonical(value: unknown): string {
	if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
	if (Array.isArray(value)) return `[${value.map((item) => canonical(item)).join(",")}]`;
	const entries = Object.entries(value as Record<string, unknown>)
		.filter(([, v]) => v !== undefined)
		.toSorted(([a], [b]) => (a < b ? -1 : 1));
	return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
}

// A `get` that misses is followed by a `set` with the same spec object, and canonicalising +
// hashing a spec (bot definitions and all) is not free — so the digest is memoised per spec.
const digests = new WeakMap<GameSpec, string>();

// Everything that determines a game's result. The opening is keyed by id when the caller has one
// (a curated set entry) and by its FEN otherwise, so an edited opening line invalidates its rows
// without disturbing the others.
export function gameKey(spec: GameSpec): string {
	const memoised = digests.get(spec);
	if (memoised !== undefined) return memoised;

	const payload = canonical({
		white: spec.white,
		black: spec.black,
		opening: spec.openingId ?? spec.openingFen,
		seed: spec.seed,
		plyLimit: spec.plyLimit,
		adjudication: spec.adjudication,
		// Only a game with a sea animal in it was played by Stockfish, so only its key moves when
		// the build does: the land games' rows stay where they are.
		stockfish: spec.white.stockfish || spec.black.stockfish ? stockfishDigest() : undefined,
	});
	const digest = createHash("sha256").update(payload).digest("hex");
	digests.set(spec, digest);
	return digest;
}

// The first bytes of the engine's digest. A game depends on the search as much as on its spec, and
// the spec does not say which build played it.
function engineDigest(): string {
	return createHash("sha256").update(readFileSync(ENGINE_URL)).digest("hex").slice(0, 16);
}

// A content-addressed store of finished games on disk. A re-run after adding or retuning one bot
// hits the cache for every game that bot is not in and only replays the rest.
//
// Kept per engine build, in a directory named by its digest: a rebuilt engine starts empty
// rather than reading back games another search played. Even a speed-only build starts over,
// which costs one cold run and never returns a stale result.
export function createGameCache({ dir: parent }: { dir: string }): {
	get: (spec: GameSpec) => GameReport | undefined;
	set: (spec: GameSpec, report: GameReport) => void;
} {
	const dir = join(parent, engineDigest());
	mkdirSync(dir, { recursive: true });

	return {
		get(spec) {
			const file = join(dir, `${gameKey(spec)}.json`);
			if (!existsSync(file)) return;
			return JSON.parse(readFileSync(file, "utf8")) as GameReport;
		},
		set(spec, report) {
			writeFileSync(join(dir, `${gameKey(spec)}.json`), JSON.stringify(report));
		},
	};
}
