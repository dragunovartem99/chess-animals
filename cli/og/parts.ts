import type { Palette } from "./palette";

// No JSX — plain objects in satori's `createElement` shape, so the CLI stays a bare tsx script.
export const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
	type,
	props: children === undefined ? { style } : { style, children },
});
export const img = (src: string, style: Record<string, unknown>) => ({
	type: "img",
	props: { src, style },
});

// An outline in the world's ink plus a chunky drop, so the title reads as a sticker peeled off a
// scrapbook.
const titleShadow = ({ ink, deep }: Palette) =>
	`5px 5px 0 ${ink}, -3px 3px 0 ${ink}, 3px -3px 0 ${ink}, -3px -3px 0 ${ink}, 0 14px 0 ${deep}`;

export function title({ text, palette }: { text: string; palette: Palette }) {
	return el(
		"div",
		{
			fontFamily: "Fredoka",
			fontSize: 104,
			fontWeight: 600,
			color: "#ffffff",
			letterSpacing: 1,
			marginTop: 8,
			transform: "rotate(-3deg)",
			textShadow: titleShadow(palette),
		},
		text
	);
}

export function tagline({ text, palette }: { text: string; palette: Palette }) {
	return el(
		"div",
		{
			marginTop: 20,
			padding: "12px 32px",
			maxWidth: 1090,
			borderRadius: 999,
			backgroundColor: palette.paper,
			border: `5px solid ${palette.ink}`,
			transform: "rotate(-1.5deg)",
			fontFamily: "Fredoka",
			fontSize: 25,
			fontWeight: 500,
			color: palette.ink,
			textAlign: "center",
			lineHeight: 1.15,
		},
		text
	);
}
