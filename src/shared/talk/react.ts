import type { Color, Role } from "chessops/types";

import type { GameResult } from "../chess";
import { moverOf } from "./facts";
import type { Facts } from "./facts";
import type { Verdict } from "./observer";
import type { Remark } from "./remark";
import { isQuiet, mateFor } from "./swing";

// One bot, one remark, and the piece it is about. The line itself is picked later, from the locale.
export type Spoken = { color: Color; remark: Remark; piece?: Role };

// How many plies behind the game a verdict may land and still be spoken. One, because a bot
// answers a human in milliseconds: the observer's verdict on the human's move always lands after
// the reply, and "check, sorry" said then is still on time. Two plies on, it is not.
export const LATE = 1;

const other = (color: Color): Color => (color === "white" ? "black" : "white");

// Every bot at the board says hello, White first.
export const greet = (bots: readonly Color[]): Spoken[] =>
	bots.map((color) => ({ color, remark: "greet" }));

// Every bot at the board has its say on the result.
export const farewell = ({ result, bots }: { result: GameResult; bots: readonly Color[] }) =>
	bots.map((color): Spoken => {
		if (result === null) return { color, remark: "draw" };

		return { color, remark: result === color ? "win" : "loss" };
	});

// The ply of the last remark, and the side whose mate was said last.
export type Last = { remark?: number; mating?: Color };

// The side a mate remark is about: the one saying `mating` has it, the one saying `mated` faces it.
const mateOf = ({ color, remark }: Spoken) =>
	remark === "mating" ? color : remark === "mated" ? other(color) : undefined;

// What is remembered once `said` has been said about `ply`: only a remark actually said starts a
// cooldown, since a remark whose lines are all spent is silence, and silence must not keep the
// next remark from coming.
export function remember({
	last,
	said,
	ply,
}: {
	last: Last;
	said: readonly Spoken[];
	ply: number;
}): Last {
	if (said.length === 0) return last;

	return {
		remark: ply,
		mating: said.map((one) => mateOf(one)).find((color) => color !== undefined) ?? last.mating,
	};
}

// A ply as the talk heard it: the observer's verdict on it and what the move did.
export type Heard = { verdict: Verdict; facts: Facts };

type Moment = Heard & {
	bots: readonly Color[];
	livePly: number;
	last: Last;
};

// `remark` in the mouth of `color`, if a bot plays it.
const say = ({ bots, color, remark, piece }: Spoken & { bots: readonly Color[] }): Spoken[] =>
	bots.includes(color) ? [piece ? { color, remark, piece } : { color, remark }] : [];

// `remark` from `color`, or when a human plays it, `answer` from the bot across the board.
function either({ answer, ...spoken }: Spoken & { answer: Remark; bots: readonly Color[] }) {
	const said = say(spoken);
	return said.length > 0 ? said : say({ ...spoken, color: other(spoken.color), remark: answer });
}

// What a bot says about the move that made `ply`, if anything: a mate found, else a piece won,
// else a check. One voice at most, so a move is one remark and not a dialogue, and nothing about a
// position the game has left behind.
//
// Only a check waits out the cooldown. A mate is said once a side, and a mate in two must not wait
// four plies behind the capture that set it up; a piece won is counted from the start of its
// exchange, so the recapture that follows it nets nothing and says nothing on its own. The piece is
// said when it is taken, never when it is left hanging, which would give it away.
export function react({ verdict, facts, bots, livePly, last }: Moment): Spoken[] {
	const { ply, score } = verdict;
	if (livePly - ply > LATE) return [];

	// Whoever's move showed it: a mate often appears only once the losing side has moved into it.
	const mating = mateFor(score);
	if (mating && mating !== last.mating)
		return either({ bots, color: mating, remark: "mating", answer: "mated" });

	const mover = moverOf(ply);
	if (facts.won)
		return either({ bots, color: mover, remark: "take", answer: "lose", piece: facts.won });
	if (!facts.check || isQuiet({ ply, lastPly: last.remark })) return [];

	return say({ bots, color: mover, remark: "check" });
}
