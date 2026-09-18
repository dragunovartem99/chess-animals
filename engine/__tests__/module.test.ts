import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

// The typed binding lands with `shared/wasm/`; until then this pins what the build promises on
// its own — a module that stands alone, with no libc and no JS glue to import.
describe("engine.wasm", () => {
	it("instantiates with no imports and reports its abi version", async () => {
		const bytes = await readFile(new URL("../build/engine.wasm", import.meta.url));
		const module = await WebAssembly.compile(bytes);
		const instance = await WebAssembly.instantiate(module, {});
		const { abi_version } = instance.exports as { abi_version: () => number };

		expect(WebAssembly.Module.imports(module)).toEqual([]);
		expect(abi_version()).toBe(1);
	});
});
