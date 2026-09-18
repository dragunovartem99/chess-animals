import { createHash } from "node:crypto";
import { globSync, readFileSync } from "node:fs";

import type { HtmlTagDescriptor, Plugin } from "vite";

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

// Its own request, apart from any other family: `text=` subsets every family in the url it is on.
export const emojiFontUrl = ({ text }: { text: string }) =>
	`https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap&text=${encodeURIComponent(text)}`;

// Google picks the format by user agent; without a modern one it falls back to TTF.
const MODERN_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36";

// A `text=` subset is always a single face. More than one means the response changed shape, and
// failing the build beats shipping a page whose portraits silently fall back to system emoji.
export const woff2Url = ({ css }: { css: string }) => {
	const urls = [...css.matchAll(/url\((\S+?)\) format\('woff2'\)/gu)].map(([, url]) => url);

	if (urls.length !== 1) throw new Error(`expected one woff2 face, got ${urls.length}`);

	return urls[0];
};

export const emojiFace = ({ href }: { href: string }) =>
	`@font-face{font-family:"Noto Color Emoji";font-display:swap;src:url(${href}) format("woff2")}`;

const readSources = () =>
	globSync("src/**/*.{ts,vue}", {
		exclude: (file) => /__tests__|__benchmarks__/u.test(file),
	}).map((file) => readFileSync(file, "utf8"));

const emojiFontLink = () => emojiFontUrl({ text: collectEmoji({ sources: readSources() }) });

const download = async ({ url }: { url: string }) => {
	const response = await fetch(url, { headers: { "User-Agent": MODERN_UA } });

	if (!response.ok) throw new Error(`${url}: ${response.status}`);

	return response;
};

// Dev links Google's stylesheet as-is: it needs no network at startup beyond the browser's own.
const devFont = (): Plugin => ({
	name: "emoji-font:dev",
	apply: "serve",
	transformIndexHtml: () => [
		{ tag: "link", attrs: { rel: "stylesheet", href: emojiFontLink() }, injectTo: "head" },
	],
});

// The build self-hosts the subset. Linked from Google it cost a render-blocking stylesheet on a
// third origin, then a font behind it, and Google serves that font with a one-day cache. Emitted
// as a hashed asset it rides the site's immutable cache, and the face is inlined so the preload
// can start the download with the HTML.
const buildFont = (): Plugin => {
	let href = "";

	return {
		name: "emoji-font:build",
		apply: "build",
		async buildStart() {
			const css = await (await download({ url: emojiFontLink() })).text();
			const font = new Uint8Array(
				await (await download({ url: woff2Url({ css }) })).arrayBuffer()
			);
			const hash = createHash("sha256").update(font).digest("hex").slice(0, 8);

			href = `/assets/noto-color-emoji-${hash}.woff2`;
			this.emitFile({ type: "asset", fileName: href.slice(1), source: font });
		},
		transformIndexHtml: (): HtmlTagDescriptor[] => [
			{
				tag: "link",
				attrs: { rel: "preload", as: "font", type: "font/woff2", href, crossorigin: true },
				injectTo: "head",
			},
			{ tag: "style", children: emojiFace({ href }), injectTo: "head" },
		],
	};
};

export const emojiFont = () => [devFont(), buildFont()];
