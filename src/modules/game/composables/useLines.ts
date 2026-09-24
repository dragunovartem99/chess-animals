import { useI18n } from "vue-i18n";

import type { LinesFor } from "@/shared/talk";

// What each animal says, in the language of the moment, with the piece it is about named the way
// its lines need it: the object form, which Russian inflects (ферзя, ладью). An animal nobody has written for comes
// back as something other than a list, and says nothing.
export function useLines(): LinesFor {
	const { t, tm, rt } = useI18n();

	return ({ id, remark, piece }) => {
		const lines: unknown = tm(`talk.${id}.${remark}`);
		const named = { piece: piece ? t(`game.talk.piece.${piece}`) : "" };

		return Array.isArray(lines) ? lines.map((line) => rt(line, named)) : [];
	};
}
