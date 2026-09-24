import type { Color, Role } from "chessops/types";

import { createRng } from "../engine";
import type { Rng } from "../engine";
import type { Facts } from "./facts";
import type { Verdict } from "./observer";
import { pickRemark } from "./pick";
import { react } from "./react";
import type { Spoken } from "./react";
import type { Remark } from "./remark";

// One remark as said, `key` counting up across the whole talk so a list can key on it.
export type Line = { key: number; color: Color; id: string; text: string };

// A bot's lines for a remark, with the piece already filled in where the remark has one.
export type LinesFor = (request: { id: string; remark: Remark; piece?: Role }) => readonly string[];

// Enough to follow the last exchange: the panel is a fixed box, and older remarks drop off its
// top rather than push the move list down.
export const KEPT = 2;

// A bot's line for a remark, never the one it said for that remark last.
function lineFor({
	id,
	remark,
	piece,
	linesFor,
	lastLine,
	rng,
}: Spoken & { id: string; linesFor: LinesFor; lastLine: Map<string, number>; rng: Rng }) {
	const lines = linesFor(piece ? { id, remark, piece } : { id, remark });
	const last = lastLine.get(`${id}.${remark}`);
	const text = pickRemark({ lines, last: last === undefined ? undefined : lines[last], rng });
	if (text !== undefined) lastLine.set(`${id}.${remark}`, lines.indexOf(text));

	return text;
}

type Hearing = { verdict: Verdict; facts: Facts; bots: readonly Color[]; livePly: number };

// Everything a game's talk remembers, with no framework and no Stockfish in it: the seeded
// stream, the verdicts so far, when the last remark was made, the last few remarks, and which
// line each bot said last for each remark — kept across games, so a bot does not open two games
// with the same hello. By position in the list rather than by text, since `{piece}` changes the
// text of what is still the same line.
export function createConversation({ linesFor, seed }: { linesFor: LinesFor; seed: () => string }) {
	let rng: Rng = createRng(seed());
	let verdicts: Verdict[] = [];
	let lastPly: number | undefined;
	let transcript: Line[] = [];
	let said = 0;
	const lastLine = new Map<string, number>();

	return {
		// A new game: a fresh stream, no verdicts and a clean slate, but the same memory of what
		// was said.
		begin() {
			rng = createRng(seed());
			verdicts = [];
			lastPly = undefined;
			transcript = [];
		},
		// Has the bots say what they want to, in order, and gives back the last few remarks.
		say({ spoken, players }: { spoken: Spoken[]; players: Record<Color, string> }): Line[] {
			const lines = spoken.flatMap((one) => {
				const id = players[one.color];
				const text = lineFor({ ...one, id, linesFor, lastLine, rng });
				return text === undefined ? [] : [{ key: (said += 1), color: one.color, id, text }];
			});
			transcript = [...transcript, ...lines].slice(-KEPT);

			return transcript;
		},
		// What the bots want to say to a verdict on the move just played; a remark starts the
		// cooldown.
		hear({ verdict, facts, bots, livePly }: Hearing): Spoken[] {
			const spoken = react({ verdicts, verdict, facts, bots, livePly, lastPly });
			verdicts[verdict.ply] = verdict;
			if (spoken.length > 0) lastPly = verdict.ply;

			return spoken;
		},
	};
}
