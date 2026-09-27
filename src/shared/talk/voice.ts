import type { Remark } from "./remark";

// Where a spoken line lives under `public/`: one clip per line.
export function clipPath({
	locale,
	id,
	remark,
	index,
}: {
	locale: string;
	id: string;
	remark: Remark;
	index: number;
}): string {
	return `voice/${locale}/${id}/${remark}-${index}.mp3`;
}

export type Clip = { path: string; text: string };

// Every clip one animal's lines make in one language.
export function clipsFor({
	locale,
	id,
	lines,
}: {
	locale: string;
	id: string;
	lines: Partial<Record<Remark, readonly string[]>>;
}): Clip[] {
	return Object.entries(lines).flatMap(([remark, said]) =>
		(said ?? []).map((text, index) => ({
			path: clipPath({ locale, id, remark: remark as Remark, index }),
			text,
		}))
	);
}
