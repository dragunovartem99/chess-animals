import { readFileSync } from "node:fs";
import path from "node:path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import sharp from "sharp";

import { ogBackground } from "./background";
import { buildTree, type CardText, type Chip, OG_WIDTH, type PieceUris } from "./tree";

const FONT_DIR = path.join(import.meta.dirname, "fonts");
const font = (file: string) => readFileSync(path.join(FONT_DIR, file));

const face = (name: string, file: string, weight: 500 | 600 | 700 | 800) => ({
	name,
	weight,
	data: font(file),
	style: "normal" as const,
});
const FONTS = [face("Fredoka", "fredoka-500.woff", 500), face("Fredoka", "fredoka-600.woff", 600)];

export async function renderOg(card: {
	text: CardText;
	chips: Chip[];
	pieceUris: PieceUris;
}): Promise<Buffer> {
	const svg = await satori(
		buildTree({ ...card, backgroundDataUri: await ogBackground() }) as never,
		{ width: OG_WIDTH, height: 630, fonts: FONTS }
	);

	// satori converts text to paths, so resvg only rasterises.
	const png = new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng();

	// Lots of flat colour and a handful of small SVGs — a quantized palette roughly halves the
	// file with no visible loss, and it ships in every deploy.
	return sharp(png).png({ palette: true, compressionLevel: 9 }).toBuffer();
}
