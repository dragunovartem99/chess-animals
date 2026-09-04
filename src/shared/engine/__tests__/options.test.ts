import { describe, expect, it } from "vitest";

import { compileBot } from "../../bots";
import { featureId } from "../../eval";
import { applyOption, describeOptions } from "../options";

const SWARM = featureId("swarm");

const config = compileBot({
	id: "wolf",
	search: { depth: 1 },
	temperature: 0,
	weights: { swarm: -12 },
});

const set = ({ name, value }: { name: string; value?: string }) =>
	applyOption({ config, name, value });

describe("describeOptions", () => {
	it("advertises the engine options but not two hundred weights", () => {
		const names = describeOptions(config).map(
			(option) => option.type === "option" && option.name
		);

		expect(names).toEqual(["Depth", "Temperature", "Quiescence", "NodeLimit", "Seed"]);
	});
});

describe("applyOption", () => {
	it("sets the search depth", () => {
		expect(set({ name: "Depth", value: "3" }).search.depth).toBe(3);
	});

	it("sets a fractional, negative weight — which is what a tuned bot is made of", () => {
		expect(set({ name: "swarm", value: "-12.5" }).weights[SWARM]).toBeCloseTo(-12.5);
	});

	it("never mutates the config it was given, so a tuner can hold on to the original", () => {
		set({ name: "swarm", value: "999" });

		expect(config.weights[SWARM]).toBe(-12);
	});

	it("turns quiescence on and off", () => {
		expect(set({ name: "Quiescence", value: "true" }).search.quiescence).toBe(true);
		expect(set({ name: "Quiescence", value: "false" }).search.quiescence).toBe(false);
	});

	it("clears the node limit when given zero", () => {
		expect(set({ name: "NodeLimit", value: "0" }).search.nodeLimit).toBeUndefined();
		expect(set({ name: "NodeLimit", value: "5000" }).search.nodeLimit).toBe(5000);
	});

	it("ignores what it cannot use rather than breaking the engine", () => {
		for (const option of [
			{ name: "Depth", value: "0" },
			{ name: "Temperature", value: "-1" },
			{ name: "swrm", value: "1" },
			{ name: "swarm", value: "not a number" },
			{ name: "Threads", value: "8" },
		]) {
			expect(set(option)).toEqual(config);
		}
	});
});
