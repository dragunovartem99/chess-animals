import { clipPath } from "@/shared/talk";
import type { Line, LinesFor } from "@/shared/talk";

// Where a said line's clip lives. A line is recorded once per piece only if it names the piece; a
// take that says "Thanks, I'll keep that" is one clip whatever was taken. Rendered both ways
// rather than read raw, since the raw message may be compiled.
export function clipOf({
	line,
	locale,
	linesFor,
}: {
	line: Line;
	locale: string;
	linesFor: LinesFor;
}): string {
	const { id, remark, index, piece } = line;
	const names =
		piece !== undefined &&
		linesFor({ id, remark, piece })[index] !== linesFor({ id, remark })[index];

	return clipPath({ locale, id, remark, index, ...(names ? { piece } : {}) });
}
