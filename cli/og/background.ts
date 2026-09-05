import sharp from "sharp";

import { OG_HEIGHT, OG_WIDTH } from "./tree";

// A flat, few-shape forest — muted sky wash, a small warm sun, layered forest-floor hills, and
// pines leaning in from the edges. Deliberately childish: no gradients on the greenery, just
// opaque blobs and one pine shape reused at different sizes, the way a picture book prints it.
// The palette is the app's: the greens are tints of the meadow's yellow-green hue (hsl(88 29%)
// in style.css), the browns are the board's dark square (hsl(27 36%)) and the walnut trunk of
// the header — not tropical brights.
// satori won't rasterise an SVG background itself, so render.ts turns this into a PNG with
// sharp first.
const PINE = `
	<g id="pine">
		<rect x="-13" y="-70" width="26" height="86" fill="#5a4028"/>
		<path d="M0 -300 L82 -150 L-82 -150 Z"/>
		<path d="M0 -220 L104 -54 L-104 -54 Z"/>
		<path d="M0 -150 L120 30 L-120 30 Z"/>
	</g>`;

const FOREST_SVG = `
<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#eef1d6"/>
			<stop offset="0.5" stop-color="#cbdf96"/>
			<stop offset="1" stop-color="#a6c96a"/>
		</linearGradient>
		${PINE}
	</defs>
	<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#sky)"/>
	<circle cx="1086" cy="34" r="104" fill="#f6d98f"/>
	<circle cx="1086" cy="34" r="74" fill="#f0c15a"/>
	<path d="M0 460 Q 300 370 620 450 T 1200 420 V 630 H 0 Z" fill="#9dbf62"/>
	<path d="M0 540 Q 260 465 560 540 T 1200 515 V 630 H 0 Z" fill="#7ba33f"/>
	<path d="M0 610 Q 320 545 640 600 T 1200 585 V 630 H 0 Z" fill="#9c6f49"/>
	<g fill="#86ab4a">
		<use href="#pine" transform="translate(80 470) scale(1.15)"/>
		<use href="#pine" transform="translate(1150 470) scale(1.05)"/>
	</g>
	<g fill="#5f8330">
		<use href="#pine" transform="translate(-20 560) scale(1.35)"/>
		<use href="#pine" transform="translate(1235 560) scale(1.3)"/>
	</g>
</svg>`;

let cached: Promise<string> | undefined;

export function ogBackground(): Promise<string> {
	cached ??= sharp(Buffer.from(FOREST_SVG))
		.png()
		.toBuffer()
		.then((png) => `data:image/png;base64,${png.toString("base64")}`);
	return cached;
}
