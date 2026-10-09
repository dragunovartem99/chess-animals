import { onBeforeUnmount, readonly, ref, toValue, watchEffect } from "vue";
import type { MaybeRefOrGetter } from "vue";

export type Theme = "sea" | "monsters";

const current = ref<Theme>();

// The theme the page is in now — `undefined` for the light one. The layout paints it on the
// document and swaps its logo by it.
export const theme = readonly(current);

// A view picks its world rather than the layout reading the route: who is playing lives in the
// query, and a module's roster isn't the shell's to read.
export function useTheme(wanted: MaybeRefOrGetter<Theme | undefined>): void {
	watchEffect(() => {
		current.value = toValue(wanted);
	});

	onBeforeUnmount(() => {
		current.value = undefined;
	});
}
