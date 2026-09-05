import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// The cburnett stylesheet the app already ships (`import "chessground/assets/chessground.cburnett.css"`
// in src/main.ts) embeds every piece as a base64 SVG data URI. The OG card draws its pieces from
// exactly that source, so the preview and the board never drift apart and no piece art is vendored.
const CSS_PATH = createRequire(import.meta.url).resolve(
	"chessground/assets/chessground.cburnett.css"
);

export type PieceKey = `${"white" | "black"}-${string}`;

export function loadPieceUris(): Record<PieceKey, string> {
	const css = readFileSync(CSS_PATH, "utf8");
	const rule = /piece\.(\w+)\.(\w+)\s*\{\s*background-image:\s*url\('([^']+)'\)/gu;
	const uris = {} as Record<PieceKey, string>;
	for (const [, role, colour, uri] of css.matchAll(rule)) {
		uris[`${colour as "white" | "black"}-${role}`] = uri;
	}
	return uris;
}
