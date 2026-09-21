import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PAGES, pageShell } from "../pages";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

describe("pageShell", () => {
	const shell = pageShell({ html, page: PAGES.monsters });

	it("points the preview at the page's own card and url", () => {
		expect(shell).toMatch(
			/property="og:image"\s+content="https:\/\/chess-animals\.com\/og-monsters\.png"/u
		);
		expect(shell).toMatch(
			/property="og:url"\s+content="https:\/\/chess-animals\.com\/monsters"/u
		);
	});

	it("titles and describes the page, in the tab as well as the card", () => {
		expect(shell).toContain(`<title>${PAGES.monsters.title}</title>`);
		expect(shell).toMatch(/name="description"\s+content="These ones play much better/u);
	});

	it("leaves the root shell as index.html already has it", () => {
		expect(pageShell({ html, page: PAGES.land })).toBe(html);
	});

	it("fails loudly on a shell missing a tag it would set", () => {
		expect(() => pageShell({ html: "<title>x</title>", page: PAGES.land })).toThrow(
			/no <meta>/u
		);
	});
});
