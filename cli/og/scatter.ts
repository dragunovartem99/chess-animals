import type { Palette } from "./palette";
import { el, img } from "./parts";
import type { Chip } from "./tree";

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

// A paper chip ringed in ink: the label was illegible sitting straight on the hill.
function label({ name, size, palette }: { name: string; size: number; palette: Palette }) {
	return el(
		"div",
		{
			marginTop: 12,
			padding: "3px 14px",
			borderRadius: 999,
			backgroundColor: palette.paper,
			border: `3px solid ${palette.ink}`,
			fontFamily: "Fredoka",
			fontSize: size,
			fontWeight: 600,
			color: palette.deep,
		},
		name
	);
}

function bubble({
	chip,
	i,
	l,
	palette,
}: {
	chip: Chip;
	i: number;
	l: ReturnType<typeof layout>;
	palette: Palette;
}) {
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
			backgroundColor: palette.paper,
			border: `${l.border}px solid ${chip.tint}`,
			boxShadow: `0 11px 0 rgba(${palette.shade},0.22)`,
		},
		[img(chip.emojiUri, { width: l.emoji, height: l.emoji })]
	);
	const kids = l.name ? [disc, label({ name: chip.name, size: l.name, palette })] : [disc];
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
export function bubbleRow({ chips, palette }: { chips: Chip[]; palette: Palette }) {
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
				row.map((c, i) => bubble({ chip: c, i: r * half + i, l, palette }))
			)
		)
	);
}
