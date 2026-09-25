import { describe, expect, it } from "vitest";

import { MONSTERS, UNDERWATER } from "@/modules/bots/roster";

import { worldOf } from "../world";

const monster = MONSTERS[0]!.definition.id;
const fish = UNDERWATER[0]!.definition.id;

describe("worldOf", () => {
	it("stays on land with nobody from another roster at the board", () => {
		expect(worldOf(["human", "fox"])).toBeUndefined();
	});

	it("goes under the sea with an underwater animal", () => {
		expect(worldOf(["human", fish])).toBe("sea");
	});

	it("puts the monsters first when they meet the sea", () => {
		expect(worldOf([fish, monster])).toBe("monsters");
	});
});
