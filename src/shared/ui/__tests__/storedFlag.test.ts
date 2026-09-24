import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { useStoredFlag } from "../storedFlag";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useStoredFlag", () => {
	it("starts from what was stored, and stores every flip", async () => {
		const store = new Map([["talk", "true"]]);
		vi.stubGlobal("localStorage", {
			getItem: (key: string) => store.get(key),
			setItem: (key: string, value: string) => store.set(key, value),
		});

		const flag = useStoredFlag("talk");
		expect(flag.value).toBe(true);

		flag.value = false;
		await nextTick();
		expect(store.get("talk")).toBe("false");
	});

	it("starts off and still flips when storage refuses to be touched", async () => {
		vi.stubGlobal("localStorage", {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("blocked");
			},
		});

		const flag = useStoredFlag("talk");
		expect(flag.value).toBe(false);

		flag.value = true;
		await nextTick();
		expect(flag.value).toBe(true);
	});
});
