import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { GameReport, GameSpec } from "./types";

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
	});
	const digest = createHash("sha256").update(payload).digest("hex");
	digests.set(spec, digest);
	return digest;
}

// A content-addressed store of finished games on disk. A re-run after adding or retuning one bot
// hits the cache for every game that bot is not in and only replays the rest.
export function createGameCache({ dir }: { dir: string }): {
	get: (spec: GameSpec) => GameReport | undefined;
	set: (spec: GameSpec, report: GameReport) => void;
} {
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
