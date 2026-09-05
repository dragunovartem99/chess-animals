import { el, img } from "./parts";
import type { Chip, PieceUris } from "./tree";

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

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// The row has to hold whatever the roster grows to, so nothing here is a fixed size: each
// animal gets an equal slice of ~1120px and the disc, emoji and label are sized off that slice.
// Past ~13 animals the slice is too narrow for a readable name, so the labels drop out.
//
// `discCap` is lower when the stickers stack in two rows: a full-width disc twice over plus its
// label runs past the 630px frame, so the two-row caller pins it smaller.
export function layout(count: number, discCap = 118) {
	const slot = Math.min(154, Math.floor(1120 / count));
	const disc = clamp(slot - 8, 44, discCap);
	return {
		slot,
		disc,
		emoji: Math.round(disc * 0.62),
		border: clamp(Math.round(disc * 0.075), 4, 8),
		name: slot >= 84 ? clamp(Math.round(slot * 0.16), 15, 22) : 0,
	};
}

function bubble(chip: Chip, i: number, l: ReturnType<typeof layout>) {
	const rot = (i % 2 === 0 ? -1 : 1) * (3 + (i % 3) * 2);
	const disc = el(
		"div",
		{
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			width: l.disc,
			height: l.disc,
			borderRadius: 999,
			backgroundColor: "#fffdf2",
			border: `${l.border}px solid ${chip.tint}`,
			boxShadow: "0 11px 0 rgba(20,60,10,0.22)",
		},
		[img(chip.emojiUri, { width: l.emoji, height: l.emoji })]
	);
	const kids = [disc];
	if (l.name) {
		kids.push(
			el(
				"div",
				{
					// A cream chip ringed in green: the label was illegible sitting straight on the hill.
					marginTop: 12,
					padding: "3px 14px",
					borderRadius: 999,
					backgroundColor: "#fffdf2",
					border: "3px solid #4a6129",
					fontFamily: "Fredoka",
					fontSize: l.name,
					fontWeight: 600,
					color: "#33481f",
				},
				chip.name
			)
		);
	}
	return el(
		"div",
		{
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			width: l.slot,
			transform: `rotate(${rot}deg)`,
		},
		kids
	);
}

// One animal is a sticker: emoji in a cream disc ringed in its tint, a hard offset shadow, and
// a slight tilt that alternates down the row, so they read as pinned on by hand.
//
// The roster is split across two rows so each disc keeps a readable size and its label as the
// field grows; both rows are sized off the fuller one (the top) so the discs match. The top row
// takes the extra sticker when the count is odd.
export function bubbleRow(chips: Chip[]) {
	const half = Math.ceil(chips.length / 2);
	const rows = [chips.slice(0, half), chips.slice(half)];
	const l = layout(half, 92);
	return el(
		"div",
		{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 30 },
		rows.map((row, r) =>
			el(
				"div",
				{ display: "flex", justifyContent: "center", marginTop: r === 0 ? 0 : 8 },
				row.map((c, i) => bubble(c, r * half + i, l))
			)
		)
	);
}
