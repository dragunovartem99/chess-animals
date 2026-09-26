import { describe, expect, it } from "vitest";

import { createConversation, MAX_SAID } from "../conversation";
import type { LinesFor } from "../conversation";
import { REMARKS } from "../remark";

const PLAYERS = { white: "human", black: "donkey" } as const;
const CHECK = [{ color: "black", remark: "check" }] as const;

// Three lines for every remark, whoever asks.
const linesFor: LinesFor = ({ remark }) => [`${remark} 1`, `${remark} 2`, `${remark} 3`];

type Conversation = ReturnType<typeof createConversation>;

// What one conversation says to `times` checks in a row: the line's index, or undefined for silence.
function checks({ conversation, times }: { conversation: Conversation; times: number }) {
	let lastKey = 0;
	return Array.from({ length: times }, () => {
		const line = conversation.say({ spoken: [...CHECK], players: PLAYERS }).at(-1);
		if (!line || line.key === lastKey) return undefined;

		lastKey = line.key;
		return line.index;
	});
}

describe("createConversation", () => {
	it("says no line more than twice a game, then falls silent", () => {
		const conversation = createConversation({ linesFor, seed: () => "seed" });
		const said = checks({ conversation, times: 8 });

		expect(said).toEqual([0, 1, 0, 2, 1, 2, undefined, undefined]);
		for (const index of [0, 1, 2])
			expect(said.filter((one) => one === index)).toHaveLength(MAX_SAID);
	});

	it("has every line fresh again in a new game", () => {
		const conversation = createConversation({ linesFor, seed: () => "seed" });
		checks({ conversation, times: 3 * MAX_SAID });
		conversation.begin();

		expect(checks({ conversation, times: 1 })).not.toEqual([undefined]);
	});

	it("keeps no cooldown for a remark it had no line left to say", () => {
		const lines = Object.fromEntries(REMARKS.map((remark) => [remark, [`${remark} 1`]]));
		lines.check = [];
		const conversation = createConversation({
			linesFor: ({ remark }) => lines[remark]!,
			seed: () => "seed",
		});
		const hear = (ply: number) =>
			conversation.hear({
				verdict: { ply, score: { cp: 0 } },
				facts: { check: true, material: 0, settled: 0 },
				bots: ["black"],
				livePly: ply,
				players: PLAYERS,
			});

		for (const ply of [0, 1, 2, 3]) hear(ply);
		lines.check = ["check 1"];

		expect(hear(4)).toEqual([
			{ color: "black", remark: "check", key: 1, id: "donkey", index: 0 },
		]);
	});
});
