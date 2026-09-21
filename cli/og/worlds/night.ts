import type { World } from "../palette";
import { OG_HEIGHT, OG_WIDTH } from "../tree";

// The forest's picture book after dark, in the monsters' colours: a violet night sky, a moon
// where the sun was, the hills gone to shadow, and gravestones leaning in from the edges where
// the pines stood. Only the sky is dark — the stickers' paper stays light, so they read on it
// the way they read on the grass.
const STONE = `
	<g id="stone">
		<path d="M-60 40 V-90 A60 60 0 0 1 60 -90 V40 Z"/>
	</g>`;

const STARS = [
	[160, 30, 3],
	[380, 70, 2],
	[560, 40, 3],
	[640, 96, 2],
	[860, 28, 3],
	[930, 110, 2],
	[120, 330, 2],
	[1040, 330, 3],
	[300, 140, 2],
]
	.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`)
	.join("");

const NIGHT_SVG = `
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#1e1238"/>
			<stop offset="0.55" stop-color="#3a2466"/>
			<stop offset="1" stop-color="#55387f"/>
		</linearGradient>
		${STONE}
	</defs>
	<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#sky)"/>
	<g fill="#f4eecb">${STARS}</g>
	<circle cx="1086" cy="34" r="104" fill="#f4eecb" opacity="0.25"/>
	<circle cx="1086" cy="34" r="74" fill="#f4eecb"/>
	<circle cx="1062" cy="52" r="12" fill="#e2d9ad"/>
	<circle cx="1108" cy="70" r="8" fill="#e2d9ad"/>
	<path d="M0 460 Q 300 370 620 450 T 1200 420 V 630 H 0 Z" fill="#2e1d4f"/>
	<path d="M0 540 Q 260 465 560 540 T 1200 515 V 630 H 0 Z" fill="#231541"/>
	<path d="M0 610 Q 320 545 640 600 T 1200 585 V 630 H 0 Z" fill="#170d2b"/>
	<g fill="#5e4789">
		<use href="#stone" transform="translate(96 500) rotate(-8) scale(0.9)"/>
		<use href="#stone" transform="translate(1110 500) rotate(7) scale(0.85)"/>
	</g>
	<g fill="#4a3470">
		<use href="#stone" transform="translate(10 600) rotate(6) scale(1.25)"/>
		<use href="#stone" transform="translate(1200 600) rotate(-6) scale(1.2)"/>
	</g>
</svg>`;

export const NIGHT: World = {
	svg: NIGHT_SVG,
	palette: { paper: "#f7f2ff", ink: "#5b2f94", deep: "#2a1450", shade: "10,0,25" },
};
