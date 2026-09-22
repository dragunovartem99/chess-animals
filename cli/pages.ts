import type { Plugin } from "vite";

import en from "../src/locales/en";

// The shareable pages, one preview card each. The site is a single-page app, and a link
// preview's crawler runs no script, so it only ever sees the shell's `<meta>` — a card per page
// takes a shell per page. Each is `index.html` with the tags swapped, emitted beside it, and the
// Caddyfile serves it for its route under any locale; the app it boots is the same one.
// English only: the crawler's locale is unknown, and the card is drawn in English anyway.
export type Page = { slug: string; image: string; title: string; description: string };

const ORIGIN = "https://chess-animals.com";

export const PAGES = {
	land: { slug: "", image: "og.png", title: "Chess Animals", description: en.roster.lead },
	underwater: {
		slug: "underwater",
		image: "og-underwater.png",
		title: `Chess Animals — ${en.nav.underwater}`,
		description: en.underwater.lead,
	},
	monsters: {
		slug: "monsters",
		image: "og-monsters.png",
		title: `Chess Animals — ${en.nav.monsters}`,
		description: en.monsters.lead,
	},
} satisfies Record<string, Page>;

const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

// Throws on a tag it can't find rather than skipping it: a reformatted `index.html` would
// otherwise ship every page with the roster's card and nobody would notice.
const setMeta = ({ html, key, value }: { html: string; key: string; value: string }) => {
	const tag = new RegExp(`(<meta\\s+(?:property|name)="${key}"\\s+content=")[^"]*(")`, "u");
	if (!tag.test(html)) throw new Error(`index.html has no <meta> for ${key}`);
	return html.replace(tag, `$1${escape(value)}$2`);
};

export function pageShell({ html, page }: { html: string; page: Page }): string {
	const tags = {
		"description": page.description,
		"og:title": page.title,
		"og:description": page.description,
		"og:url": `${ORIGIN}/${page.slug}`,
		"og:image": `${ORIGIN}/${page.image}`,
		"og:image:alt": `${page.title}: the roster, weakest first`,
	};
	return Object.entries(tags).reduce(
		(out, [key, value]) => setMeta({ html: out, key, value }),
		html.replace(/<title>[^<]*<\/title>/u, `<title>${escape(page.title)}</title>`)
	);
}

// `post`, so `index.html` is already in the bundle, with every other plugin's tags injected.
export const pageShells = (): Plugin => ({
	name: "page-shells",
	apply: "build",
	enforce: "post",
	generateBundle(_, bundle) {
		const index = bundle["index.html"];
		if (index?.type !== "asset") throw new Error("no index.html in the bundle");

		for (const page of Object.values(PAGES).filter(({ slug }) => slug)) {
			const html = pageShell({ html: String(index.source), page });
			this.emitFile({ type: "asset", fileName: `${page.slug}.html`, source: html });
		}
	},
});
