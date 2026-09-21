import type { World } from "../palette";
import { OG_HEIGHT, OG_WIDTH } from "../tree";

// The forest's picture book, sunk: the same flat, few-shape drawing, with the sky turned into
// water that darkens with depth, the sun into light breaking through the surface, the hills into
// sand and the pines into kelp swaying in from the edges. The blues are the site's own sea theme
// (the teal button, the steel-blue squares), lifted a few steps so the stickers still read.
const KELP = `
	<g id="kelp">
		<path d="M0 40 C 34 -20 -34 -80 0 -140 C 34 -200 -34 -260 0 -320" fill="none"
			stroke-width="26" stroke-linecap="round"/>
		<ellipse cx="22" cy="-110" rx="26" ry="11" transform="rotate(-30 22 -110)"/>
		<ellipse cx="-22" cy="-230" rx="26" ry="11" transform="rotate(30 -22 -230)"/>
	</g>`;

// Where the bubbles rise: clear of the title and the tagline, which sit in the middle band.
const BUBBLES = [
	[190, 330, 12],
	[214, 290, 7],
	[996, 330, 10],
	[1016, 296, 6],
	[1030, 262, 9],
	[128, 420, 8],
	[1080, 420, 7],
]
	.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`)
	.join("");

const SEA_SVG = `
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#bfeaf3"/>
			<stop offset="0.45" stop-color="#5fb8d3"/>
			<stop offset="1" stop-color="#2a7fa3"/>
		</linearGradient>
		${KELP}
	</defs>
	<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#water)"/>
	<g fill="#ffffff" opacity="0.18">
		<path d="M1010 0 L1150 0 L860 630 L700 630 Z"/>
		<path d="M760 0 L840 0 L520 630 L420 630 Z"/>
		<path d="M1180 0 L1200 0 L1200 380 L1060 630 L1000 630 Z"/>
	</g>
	<circle cx="1086" cy="34" r="104" fill="#e6f8fc" opacity="0.7"/>
	<circle cx="1086" cy="34" r="70" fill="#f8feff"/>
	<g fill="none" stroke="#f2fbff" stroke-width="3" opacity="0.85">${BUBBLES}</g>
	<path d="M0 490 Q 300 420 620 480 T 1200 450 V 630 H 0 Z" fill="#3d93b0"/>
	<path d="M0 560 Q 260 500 560 560 T 1200 540 V 630 H 0 Z" fill="#e3cf98"/>
	<path d="M0 610 Q 320 560 640 605 T 1200 590 V 630 H 0 Z" fill="#c9a96a"/>
	<g fill="#3f9e78" stroke="#3f9e78">
		<use href="#kelp" transform="translate(90 500) scale(1.1)"/>
		<use href="#kelp" transform="translate(1140 500) scale(1.05)"/>
	</g>
	<g fill="#23775a" stroke="#23775a">
		<use href="#kelp" transform="translate(10 600) scale(1.4)"/>
		<use href="#kelp" transform="translate(1200 600) scale(1.35)"/>
	</g>
</svg>`;

export const SEA: World = {
	svg: SEA_SVG,
	palette: { paper: "#f2fbff", ink: "#0e5a73", deep: "#073b4d", shade: "0,35,60" },
};
