import { onBeforeUnmount, readonly, ref, toValue, watchEffect } from "vue";
import type { MaybeRefOrGetter } from "vue";

export type Theme = "sea";

const current = ref<Theme>();

// The theme the page is in now — `undefined` for the light one. The layout paints it on the
// document and swaps its logo by it.
export const theme = readonly(current);

// A view says which world it is in, and the page follows: the underwater roster always, and the
// play view when a sea animal is on the board. A view asks rather than the layout deciding from
// the route, because the layout cannot know who is playing — that is in the query, and a module's
// roster is not the shell's to read.
export function useTheme(wanted: MaybeRefOrGetter<Theme | undefined>): void {
	watchEffect(() => {
		current.value = toValue(wanted);
	});

	onBeforeUnmount(() => {
		current.value = undefined;
	});
}
