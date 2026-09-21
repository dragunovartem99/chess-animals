import { describe, expect, it } from "vitest";

import { compileBot } from "../../bots";
import { applySeaOption, describeSeaOptions } from "../options";

const shark = compileBot({
	id: "shark",
	search: { depth: 3 },
	stockfish: { nodes: 100, mix: 30 },
	weights: { kingDanger: -40 },
});

describe("sea options", () => {
	it("advertises the node budget and the mix", () => {
		expect(describeSeaOptions(shark)).toMatchObject([
			{ name: "Nodes", default: "100" },
			{ name: "Mix", default: "30" },
		]);
	});

	it("sets them without touching the rest", () => {
		const next = applySeaOption({ config: shark, name: "Mix", value: "75" });

		expect(next?.stockfish).toEqual({ nodes: 100, mix: 75 });
		expect(next?.weights).toBe(shark.weights);
	});

	it("lets the mix reach both ends", () => {
		expect(applySeaOption({ config: shark, name: "Mix", value: "0" })?.stockfish?.mix).toBe(0);
		expect(applySeaOption({ config: shark, name: "Mix", value: "100" })?.stockfish?.mix).toBe(
			100
		);
	});

	it("leaves an option that is not the sea's to the land engine", () => {
		expect(applySeaOption({ config: shark, name: "swarm", value: "7" })).toBeUndefined();
	});

	it.each([
		["Nodes", "0"],
		["Nodes", "many"],
		["Mix", "-1"],
		["Mix", "101"],
		["Mix", undefined],
	])("ignores %s = %s", (name, value) => {
		expect(applySeaOption({ config: shark, name, value })).toBe(shark);
	});

	it("leaves a land bot alone", () => {
		const land = compileBot({ id: "owl", search: { depth: 3 }, weights: {} });

		expect(applySeaOption({ config: land, name: "Mix", value: "50" })).toBe(land);
	});
});
