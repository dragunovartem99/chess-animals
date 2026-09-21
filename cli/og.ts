import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import en from "@/locales/en";
import { MONSTERS, ROSTER, UNDERWATER } from "@/modules/bots/roster";
import type { Animal } from "@/modules/bots/roster";

import { emojiUri } from "./og/emoji";
import type { World } from "./og/palette";
import { loadPieceUris } from "./og/pieces";
import { renderOg } from "./og/render";
import { FOREST } from "./og/worlds/forest";
import { NIGHT } from "./og/worlds/night";
import { SEA } from "./og/worlds/sea";
import { PAGES } from "./pages";
import type { Page } from "./pages";

// `tsx cli/og.ts` — render a social preview card per roster into `public/`, run from
// `npm run build` so a deploy always ships the current rosters. Each page's shell points at its
// own card (see ./pages.ts); every card is one layout, painted in its world's colours.

const CARDS: { page: Page; animals: Animal[]; world: World }[] = [
	{ page: PAGES.land, animals: ROSTER, world: FOREST },
	{ page: PAGES.underwater, animals: UNDERWATER, world: SEA },
	{ page: PAGES.monsters, animals: MONSTERS, world: NIGHT },
];

const pieceUris = loadPieceUris();
const outDir = path.join(import.meta.dirname, "..", "public");
mkdirSync(outDir, { recursive: true });

async function renderCard({ page, animals, world }: (typeof CARDS)[number]) {
	const chips = await Promise.all(
		animals.map(async (animal) => ({
			name: en.bot[animal.definition.id as keyof typeof en.bot].name,
			tint: animal.tint,
			emojiUri: await emojiUri(animal.emoji),
		}))
	);

	const png = await renderOg({
		text: { title: en.app.title, tagline: page.description },
		chips,
		pieceUris,
		world,
	});

	const outPath = path.join(outDir, page.image);
	writeFileSync(outPath, png);
	console.log(
		`og image: ${(png.length / 1024).toFixed(0)} KB -> ${path.relative(process.cwd(), outPath)}`
	);
}

await Promise.all(CARDS.map((card) => renderCard(card)));
