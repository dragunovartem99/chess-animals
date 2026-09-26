import type { Color, Role } from "chessops/types";

import { createRng } from "../engine";
import type { Rng } from "../engine";
import type { Facts } from "./facts";
import type { Heard } from "./gain";
import type { Verdict } from "./observer";
import { pickRemark } from "./pick";
import { react, remember } from "./react";
import type { Last, Spoken } from "./react";
import type { Remark } from "./remark";

// One remark as said: which of the bot's lines it was, not its text, so it is read out in whatever
// language the page is in now rather than the one it was said in. `key` counts up across the
// whole talk so a list can key on it.
export type Line = Spoken & { key: number; id: string; index: number };

// A bot's lines for a remark, with the piece already filled in where the remark has one.
export type LinesFor = (request: { id: string; remark: Remark; piece?: Role }) => readonly string[];

// Enough to follow the last exchange: the panel is a fixed box, and older remarks drop off its
// top rather than push the move list down.
export const KEPT = 2;

// How often one line may come up in a game: a third time, a bot sounds like a recording. Once
// every line of a remark is spent, the bot says nothing to it for the rest of the game.
export const MAX_SAID = 2;

// Which of a bot's lines it says for a remark: never the one it said for that remark last, nor
// one it has said `MAX_SAID` times this game.
function lineFor({
	id,
	remark,
	piece,
	linesFor,
	lastLine,
	timesSaid,
	rng,
}: Spoken & {
	id: string;
	linesFor: LinesFor;
	lastLine: Map<string, number>;
	timesSaid: Map<string, number>;
	rng: Rng;
}) {
	const key = `${id}.${remark}`;
	const lines = linesFor(piece ? { id, remark, piece } : { id, remark });
	const fresh = lines.filter((_, index) => (timesSaid.get(`${key}.${index}`) ?? 0) < MAX_SAID);
	const last = lastLine.get(key);
	const lastText = last === undefined ? undefined : lines[last];
	const text = pickRemark({ lines: fresh, last: lastText, rng });
	if (text === undefined) return undefined;

	const index = lines.indexOf(text);
	lastLine.set(key, index);
	timesSaid.set(`${key}.${index}`, (timesSaid.get(`${key}.${index}`) ?? 0) + 1);
	return index;
}

type Players = { players: Record<Color, string> };

type Hearing = Players & {
	verdict: Verdict;
	facts: Facts;
	bots: readonly Color[];
	livePly: number;
};

// Everything a game's talk remembers, with no framework and no Stockfish in it: the seeded
// stream, every ply heard so far, when the last remark and the last news were made, the last few
// remarks, how often each line has come up this game, and which line each bot said last for each
// remark — the last kept across games, so a bot does not open two games with the same hello. By
// position in the list rather than by text, since `{piece}` changes the text of what is still the
// same line.
export function createConversation({ linesFor, seed }: { linesFor: LinesFor; seed: () => string }) {
	let rng: Rng = createRng(seed());
	let heard: Heard[] = [];
	let last: Last = {};
	let transcript: Line[] = [];
	let said = 0;
	let timesSaid = new Map<string, number>();
	const lastLine = new Map<string, number>();

	// The lines the bots actually say to `spoken`, kept in the transcript.
	function utter({ spoken, players }: Players & { spoken: Spoken[] }): Line[] {
		const lines = spoken.flatMap((one): Line[] => {
			const id = players[one.color];
			const index = lineFor({ ...one, id, linesFor, lastLine, timesSaid, rng });
			return index === undefined ? [] : [{ ...one, key: (said += 1), id, index }];
		});
		transcript = [...transcript, ...lines].slice(-KEPT);

		return lines;
	}

	return {
		// A new game: a fresh stream, nothing heard, a clean slate and every line fresh again, but
		// the same memory of what was said last.
		begin() {
			rng = createRng(seed());
			timesSaid = new Map();
			heard = [];
			last = {};
			transcript = [];
		},
		// Has the bots say what they want to, in order, and gives back the last few remarks.
		say({ spoken, players }: Players & { spoken: Spoken[] }): Line[] {
			utter({ spoken, players });

			return transcript;
		},
		// Has the bots say what they want to about a verdict on the move just played, and gives
		// back the last few remarks.
		hear({ verdict, facts, bots, livePly, players }: Hearing): Line[] {
			heard[verdict.ply] = { verdict, facts };
			const spoken = react({ heard, ply: verdict.ply, bots, livePly, last });
			last = remember({ last, said: utter({ spoken, players }), ply: verdict.ply });

			return transcript;
		},
	};
}
