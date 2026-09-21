import { describe, expect, it } from "vitest";

import { compileBot } from "../../bots";
import { applyMonsterOption, describeMonsterOptions } from "../options";

const shark = compileBot({
	id: "shark",
	search: { depth: 1 },
	stockfish: { nodes: 100, lines: 5, temperature: 30 },
	weights: {},
});

describe("monster options", () => {
	it("advertises the node budget, the lines and the temperature", () => {
		expect(describeMonsterOptions(shark)).toMatchObject([
			{ name: "Nodes", default: "100" },
			{ name: "Lines", default: "5" },
			{ name: "Temperature", default: "30" },
		]);
	});

	it("sets them without touching the rest", () => {
		const next = applyMonsterOption({ config: shark, name: "Temperature", value: "75" });

		expect(next?.stockfish).toEqual({ nodes: 100, lines: 5, temperature: 75 });
		expect(next?.weights).toBe(shark.weights);
	});

	it("lets the lines and the temperature reach their ends", () => {
		const set = (name: string, value: string) =>
			applyMonsterOption({ config: shark, name, value })?.stockfish;

		expect(set("Temperature", "0")?.temperature).toBe(0);
		expect(set("Lines", "1")?.lines).toBe(1);
		expect(set("Lines", "500")?.lines).toBe(500);
	});

	it("leaves an option that is not a monster's to the land engine", () => {
		expect(applyMonsterOption({ config: shark, name: "swarm", value: "7" })).toBeUndefined();
	});

	it.each([
		["Nodes", "0"],
		["Nodes", "many"],
		["Lines", "0"],
		["Lines", "501"],
		["Temperature", "-1"],
		["Temperature", undefined],
	])("ignores %s = %s", (name, value) => {
		expect(applyMonsterOption({ config: shark, name, value })).toBe(shark);
	});

	it("leaves a land bot alone", () => {
		const land = compileBot({ id: "owl", search: { depth: 3 }, weights: {} });

		expect(applyMonsterOption({ config: land, name: "Lines", value: "3" })).toBe(land);
	});
});
