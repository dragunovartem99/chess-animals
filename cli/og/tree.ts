import { el, tagline, title } from "./parts";
import { bubbleRow, floatingPieces } from "./scatter";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type Chip = { name: string; tint: string; emojiUri: string };
export type CardText = { title: string; tagline: string };
export type PieceUris = Record<string, string>;

export function buildTree({
	text,
	chips,
	pieceUris,
	backgroundDataUri,
}: {
	text: CardText;
	chips: Chip[];
	pieceUris: PieceUris;
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
			paddingTop: 16,
			backgroundImage: `url(${backgroundDataUri})`,
			backgroundSize: `${OG_WIDTH}px ${OG_HEIGHT}px`,
		},
		[...floatingPieces(pieceUris), title(text.title), tagline(text.tagline), bubbleRow(chips)]
	);
}
