import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { FEATURES } from "@/shared/eval";

// The C engine's feature ids, generated from the registry so the two can never disagree about a
// slot. A feature is still one entry in `features.ts`, and this is how the C side learns of it.
// Not `features.h`: glibc owns that name, and `-Iinclude` would shadow its header with this one.
// `npm run engine:features` rewrites the header, and a spec fails while the committed one is stale.
export const HEADER_PATH = fileURLToPath(
	new URL("../engine/include/feature_ids.h", import.meta.url)
);

// `kingDanger` becomes `FEATURE_KING_DANGER`, so the C name still reads as the key it came from.
function constantName(key: string): string {
	return `FEATURE_${key.replaceAll(/[A-Z]/gu, (letter) => `_${letter}`).toUpperCase()}`;
}

export function renderFeaturesHeader(): string {
	const entries = FEATURES.map((feature) => `\t${constantName(feature.key)} = ${feature.id},`);
	// Four spaces, not a tab: clang-format indents an initializer as a continuation.
	const keys = FEATURES.map(
		(feature) => `    [${constantName(feature.key)}] = "${feature.key}",`
	);

	return [
		"// Generated from src/shared/eval/features.ts by `npm run engine:features` — do not edit.",
		"#ifndef ENGINE_FEATURE_IDS_H",
		"#define ENGINE_FEATURE_IDS_H",
		"",
		"// One slot per registry entry, numbered as the TS feature and weight vectors number them.",
		"enum {",
		...entries,
		`\tFEATURE_COUNT = ${FEATURES.length}`,
		"};",
		"",
		"// The registry keys in slot order, for output that names a feature.",
		"static const char *const FEATURE_KEYS[FEATURE_COUNT] = {",
		...keys,
		"};",
		"",
		"#endif",
		"",
	].join("\n");
}

export function isHeaderCurrent(): boolean {
	return readFileSync(HEADER_PATH, "utf8") === renderFeaturesHeader();
}

if (process.argv[1] === import.meta.filename) {
	writeFileSync(HEADER_PATH, renderFeaturesHeader());
	console.log(`${FEATURES.length} features -> ${HEADER_PATH}`);
}
