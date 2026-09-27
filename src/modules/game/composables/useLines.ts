import { useI18n } from "vue-i18n";

import type { LinesFor } from "@/shared/talk";

// What each animal says, in the language of the moment. An animal nobody has written for comes
// back as something other than a list, and says nothing.
export function useLines(): LinesFor {
	const { tm, rt } = useI18n();

	return ({ id, remark }) => {
		const lines: unknown = tm(`talk.${id}.${remark}`);

		return Array.isArray(lines) ? lines.map((line) => rt(line)) : [];
	};
}
