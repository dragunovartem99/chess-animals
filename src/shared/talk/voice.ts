import type { Role } from "chessops/types";

import type { Remark } from "./remark";

// Where a spoken line lives under `public/`: one clip per line, and one per piece for a line that
// names one, since a voice cannot be spliced mid-sentence without sounding it.
export function clipPath({
	locale,
	id,
	remark,
	index,
	piece,
}: {
	locale: string;
	id: string;
	remark: Remark;
	index: number;
	piece?: Role;
}): string {
	return `voice/${locale}/${id}/${remark}-${index}${piece ? `-${piece}` : ""}.mp3`;
}

export type Clip = { path: string; text: string };

// A king is never taken, so it is never spoken.
const SPOKEN: Role[] = ["pawn", "knight", "bishop", "rook", "queen"];

// Every clip one animal's lines make in one language: a line with `{piece}` once per piece, in
// the form the locale gives it.
export function clipsFor({
	locale,
	id,
	lines,
	pieces,
}: {
	locale: string;
	id: string;
	lines: Partial<Record<Remark, readonly string[]>>;
	pieces: Record<Role, string>;
}): Clip[] {
	return Object.entries(lines).flatMap(([remark, said]) =>
		(said ?? []).flatMap((line, index) => {
			const at = { locale, id, remark: remark as Remark, index };
			if (!line.includes("{piece}")) return [{ path: clipPath(at), text: line }];

			return SPOKEN.map((piece) => ({
				path: clipPath({ ...at, piece }),
				text: line.replaceAll("{piece}", pieces[piece]),
			}));
		})
	);
}
