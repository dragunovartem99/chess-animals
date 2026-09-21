import sharp from "sharp";

// satori won't rasterise an SVG background itself, so each world's is turned into a PNG with
// sharp first — once, however many cards reuse it.
const cache = new Map<string, Promise<string>>();

export function ogBackground({ svg }: { svg: string }): Promise<string> {
	let uri = cache.get(svg);
	if (!uri) {
		uri = sharp(Buffer.from(svg))
			.png()
			.toBuffer()
			.then((png) => `data:image/png;base64,${png.toString("base64")}`);
		cache.set(svg, uri);
	}
	return uri;
}
