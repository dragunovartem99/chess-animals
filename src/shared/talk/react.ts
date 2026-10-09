import type { Color } from "chessops/types";

import type { GameResult } from "../chess";
import { isQuiet } from "./cooldown";
import { moverOf } from "./facts";
import type { Facts } from "./facts";
import type { Remark } from "./remark";

// One bot and one remark. The line itself is picked later, from the locale.
export type Spoken = { color: Color; remark: Remark };

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

// The ply of the last remark actually said: only a remark said starts a cooldown, since a remark
// whose lines are all spent is silence, and silence must not keep the next remark from coming.
export const remember = ({
	last,
	said,
	ply,
}: {
	last?: number;
	said: readonly Spoken[];
	ply: number;
}) => (said.length > 0 ? ply : last);

// A ply and what the move that made it did.
export type Heard = { ply: number; facts: Facts };

type Moment = Heard & { bots: readonly Color[]; last?: number };

// `remark` in the mouth of `color`, if a bot plays it.
const say = ({ bots, color, remark }: Spoken & { bots: readonly Color[] }): Spoken[] =>
	bots.includes(color) ? [{ color, remark }] : [];

// `remark` from `color`, or when a human plays it, `answer` from the bot across the board.
function either({ answer, ...spoken }: Spoken & { answer: Remark; bots: readonly Color[] }) {
	const said = say(spoken);
	return said.length > 0 ? said : say({ ...spoken, color: other(spoken.color), remark: answer });
}

// One remark per move at most — a piece won, else a check — and none inside the cooldown. A hanging
// piece or a mate is never announced: it would hand the player the answer.
export function react({ ply, facts, bots, last }: Moment): Spoken[] {
	if (isQuiet({ ply, lastPly: last })) return [];

	const mover = moverOf(ply);
	if (facts.won) return either({ bots, color: mover, remark: "take", answer: "taken" });

	return facts.check ? say({ bots, color: mover, remark: "check" }) : [];
}
