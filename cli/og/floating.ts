import { img } from "./parts";
import type { PieceUris } from "./tree";

// Chess pieces strewn around the edges like toys tipped out of a box — one of each of the six,
// tilted, mismatched sizes, a soft shadow under each, all kept clear of the middle band where
// the words go and of the sun in the top-right. The white cburnett set only: its heavy black
// outline reads as a cartoon toy against the greenery, where the black pieces flattened into
// dark blobs.
const FLOATING = [
	{ key: "white-knight", left: 34, top: 50, size: 146, rot: -14 },
	{ key: "white-bishop", left: 250, top: 12, size: 74, rot: -10 },
	{ key: "white-pawn", left: 470, top: 6, size: 54, rot: 9 },
	{ key: "white-queen", left: 700, top: 10, size: 70, rot: -7 },
	{ key: "white-rook", left: 20, top: 196, size: 112, rot: 9 },
	{ key: "white-king", left: 1096, top: 200, size: 96, rot: -10 },
];

export function floatingPieces(uris: PieceUris) {
	return FLOATING.map(({ key, left, top, size, rot }) =>
		img(uris[key], {
			position: "absolute",
			left,
			top,
			width: size,
			height: size,
			transform: `rotate(${rot}deg)`,
			filter: "drop-shadow(0 0 4px #fffdf2) drop-shadow(0 0 4px #fffdf2) drop-shadow(0 10px 6px rgba(20,60,10,0.35))",
		})
	);
}
