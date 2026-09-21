import { floatingPieces } from "./floating";
import type { Palette } from "./palette";
import { el, tagline, title } from "./parts";
import { bubbleRow } from "./scatter";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type Chip = { name: string; tint: string; emojiUri: string };
export type CardText = { title: string; tagline: string };
export type PieceUris = Record<string, string>;

export function buildTree({
	text,
	chips,
	pieceUris,
	palette,
	backgroundDataUri,
}: {
	text: CardText;
	chips: Chip[];
	pieceUris: PieceUris;
	palette: Palette;
	backgroundDataUri: string;
}) {
	return el(
		"div",
		{
			position: "relative",
			width: OG_WIDTH,
			height: OG_HEIGHT,
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			paddingTop: 40,
			backgroundImage: `url(${backgroundDataUri})`,
			backgroundSize: `${OG_WIDTH}px ${OG_HEIGHT}px`,
		},
		[
			...floatingPieces({ uris: pieceUris, palette }),
			title({ text: text.title, palette }),
			tagline({ text: text.tagline, palette }),
			bubbleRow({ chips, palette }),
		]
	);
}
