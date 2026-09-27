import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { STOCKFISH_WASM_URL } from "../monsters/process";
import { MAIA_MODEL_URL } from "../underwater/model";
import { MAIA_SESSION_OPTIONS } from "../underwater/session";
import { ENGINE_URL } from "../wasm";
import type { GameReport, GameSpec } from "./types";

// The first bytes of a vendored file's digest, read once per file.
const vendored = new Map<string, string>();
function fileDigest(url: URL): string {
	const known = vendored.get(url.href);
	if (known !== undefined) return known;

	const digest = createHash("sha256").update(readFileSync(url)).digest("hex").slice(0, 16);
	vendored.set(url.href, digest);
	return digest;
}

// A land animal plays our engine's search; the others ask Maia or Stockfish instead.
const isLand = (bot: GameSpec["white"]): boolean => !bot.maia && !bot.stockfish;

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
		// Only a game with a monster in it was played by Stockfish, so only its key moves when
		// the build does: the land games' rows stay where they are.
		stockfish:
			spec.white.stockfish || spec.black.stockfish
				? fileDigest(STOCKFISH_WASM_URL)
				: undefined,
		// The same for Maia's model, and for how its session is built.
		maia:
			spec.white.maia || spec.black.maia
				? [fileDigest(MAIA_MODEL_URL), MAIA_SESSION_OPTIONS]
				: undefined,
		// And our own engine: only a land animal searches with it. A game between two animals
		// that ask Maia or Stockfish never calls it, so an engine rebuild must not throw away
		// the arena's slowest games.
		engine: isLand(spec.white) || isLand(spec.black) ? fileDigest(ENGINE_URL) : undefined,
	});
	const digest = createHash("sha256").update(payload).digest("hex");
	digests.set(spec, digest);
	return digest;
}

// A content-addressed store of finished games on disk. A re-run after adding or retuning one bot
// hits the cache for every game that bot is not in and only replays the rest. A rebuilt engine
// replays only the games a land animal is in — its build is in their keys, not in the directory.
// Even a speed-only build replays them, which costs one run and never returns a stale result.
export function createGameCache({ dir: parent }: { dir: string }): {
	get: (spec: GameSpec) => GameReport | undefined;
	set: (spec: GameSpec, report: GameReport) => void;
} {
	const dir = join(parent, "games");
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
