import { globSync, readFileSync } from "node:fs";

import type { Plugin } from "vite";

// The full Noto Color Emoji is ~750 KB across three subsets, and the roster's portraits are the
// page's largest paint — so LCP waited on the font swap. Google Fonts' `text=` cuts it to the
// glyphs asked for (~25 KB). The list is scanned from source rather than taken from the roster
// so the logo and UI icons ride along, and a new animal can't ship as a system-font fallback.

// ZWJ and VS16 are not pictographic themselves but must be requested: 🐦‍⬛ is built from a
// ZWJ, and 🕷️ / 🕊️ need the variation selector to pick their emoji presentation.
const EMOJI_PART = /\p{Extended_Pictographic}|\u200D|\uFE0F/gu;

// Sorted so the url, and with it the browser's cached font, only changes when the set does.
export const collectEmoji = ({ sources }: { sources: string[] }) =>
	[...new Set(sources.flatMap((source) => source.match(EMOJI_PART) ?? []))].toSorted().join("");

// Its own request, apart from Noto Sans: `text=` subsets every family in the url it is on.
export const emojiFontUrl = ({ text }: { text: string }) =>
	`https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap&text=${encodeURIComponent(text)}`;

const readSources = () =>
	globSync("src/**/*.{ts,vue}", {
		exclude: (file) => /__tests__|__benchmarks__/u.test(file),
	}).map((file) => readFileSync(file, "utf8"));

export const emojiFont = (): Plugin => ({
	name: "emoji-font",
	transformIndexHtml: () => [
		{
			tag: "link",
			attrs: {
				rel: "stylesheet",
				href: emojiFontUrl({ text: collectEmoji({ sources: readSources() }) }),
			},
			injectTo: "head",
		},
	],
});
