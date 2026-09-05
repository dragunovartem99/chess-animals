// No JSX — plain objects in satori's `createElement` shape, so the CLI stays a bare tsx script.
export const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
	type,
	props: children === undefined ? { style } : { style, children },
});
export const img = (src: string, style: Record<string, unknown>) => ({
	type: "img",
	props: { src, style },
});

// A green outline plus a chunky drop, so the title reads as a sticker peeled off a scrapbook.
const TITLE_SHADOW =
	"5px 5px 0 #4a6129, -3px 3px 0 #4a6129, 3px -3px 0 #4a6129, -3px -3px 0 #4a6129, 0 14px 0 #33481f";

export function title(text: string) {
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
			textShadow: TITLE_SHADOW,
		},
		text
	);
}

export function tagline(text: string) {
	return el(
		"div",
		{
			marginTop: 20,
			padding: "12px 32px",
			maxWidth: 1090,
			borderRadius: 999,
			backgroundColor: "#fffdf2",
			border: "5px solid #4a6129",
			transform: "rotate(-1.5deg)",
			fontFamily: "Fredoka",
			fontSize: 25,
			fontWeight: 500,
			color: "#4a6129",
			textAlign: "center",
			lineHeight: 1.15,
		},
		text
	);
}
