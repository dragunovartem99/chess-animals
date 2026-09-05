import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import en from "@/locales/en";
import bots from "@/locales/en/bots";
import { ROSTER } from "@/modules/bots/roster";

import { emojiUri } from "./og/emoji";
import { loadPieceUris } from "./og/pieces";
import { renderOg } from "./og/render";

// `tsx cli/og.ts` — render the social preview card to `public/og.png`, run from `npm run build`
// so a deploy always ships the current roster. One image for the whole site: GitHub Pages serves
// a single shell, so per-route cards would need prerendering the SPA doesn't do.

const chips = await Promise.all(
	ROSTER.map(async (animal) => ({
		name: bots[animal.definition.id as keyof typeof bots].name,
		tint: animal.tint,
		emojiUri: await emojiUri(animal.emoji),
	}))
);

const png = await renderOg({
	text: { title: en.app.title, tagline: en.app.tagline },
	chips,
	pieceUris: loadPieceUris(),
});

const outPath = path.join(import.meta.dirname, "..", "public", "og.png");
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, png);

console.log(
	`og image: ${(png.length / 1024).toFixed(0)} KB -> ${path.relative(process.cwd(), outPath)}`
);
