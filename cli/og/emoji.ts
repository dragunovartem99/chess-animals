import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Google's Noto emoji SVGs — the same family the site loads as a web font (Noto Color Emoji in
// index.html). satori can't rasterise a colour-emoji *font*, so the animal glyphs come in as
// images instead, cached under ./emoji as `<lower-hex codepoint>.svg`. A glyph the roster adds
// later is fetched from Noto on the next build and committed alongside the rest.
const EMOJI_DIR = path.join(import.meta.dirname, "emoji");
const NOTO_RAW = "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg";

function codepoint(emoji: string): string {
	// Strip the U+FE0F variation selector Noto drops from its filenames (e.g. 🐿️ -> 1f43f).
	return [...emoji]
		.map((ch) => ch.codePointAt(0)!)
		.filter((cp) => cp !== 0xfe0f)
		.map((cp) => cp.toString(16))
		.join("-");
}

export async function emojiUri(emoji: string): Promise<string> {
	const file = path.join(EMOJI_DIR, `${codepoint(emoji)}.svg`);
	if (!existsSync(file)) {
		const res = await fetch(`${NOTO_RAW}/emoji_u${codepoint(emoji).replaceAll("-", "_")}.svg`);
		if (!res.ok) throw new Error(`no Noto emoji for ${emoji} (${codepoint(emoji)})`);
		writeFileSync(file, Buffer.from(await res.arrayBuffer()));
	}
	return `data:image/svg+xml;base64,${readFileSync(file).toString("base64")}`;
}
