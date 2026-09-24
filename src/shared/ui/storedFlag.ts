import { ref, watch } from "vue";
import type { Ref } from "vue";

// A switch that survives a reload, kept per browser. Storage can be missing (a test, a server) or
// refuse to be touched (a private window, blocked site data); either way the switch still works,
// it just starts off next time.
export function useStoredFlag(key: string): Ref<boolean> {
	let stored: string | null | undefined;
	try {
		stored = globalThis.localStorage?.getItem(key);
	} catch {
		stored = undefined;
	}

	const flag = ref(stored === "true");
	watch(flag, (on) => {
		try {
			globalThis.localStorage?.setItem(key, String(on));
		} catch {
			// Not remembered this time; the switch itself already flipped.
		}
	});

	return flag;
}
