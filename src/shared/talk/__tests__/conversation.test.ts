import { describe, expect, it } from "vitest";

import { createConversation, MAX_SAID } from "../conversation";
import type { LinesFor } from "../conversation";

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
});
