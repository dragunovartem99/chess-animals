import type { Color, Role } from "chessops/types";

import type { GameResult } from "../chess";
import { moverOf } from "./facts";
import { pieceWon } from "./gain";
import type { Heard } from "./gain";
import type { Remark } from "./remark";
import type { Score } from "./score";
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

// The ply of the last remark, and of the last that was news: a capture or a mate; and the side
// whose mate was said last.
export type Last = { remark?: number; news?: number; mating?: Color };

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
}) {
	if (said.length === 0) return last;

	const isNews = said.some((one) => one.remark !== "check");
	const mating = said.find((one) => one.remark === "mating")?.color ?? last.mating;
	return { remark: ply, news: isNews ? ply : last.news, mating };
}

type Moment = {
	// Everything heard so far, by ply, up to and including `ply`, the move to react to.
	heard: readonly (Heard | undefined)[];
	ply: number;
	bots: readonly Color[];
	livePly: number;
	last: Last;
};

// `remark` in the mouth of `color`, if a bot plays it.
const say = ({ bots, color, remark, piece }: Spoken & { bots: readonly Color[] }): Spoken[] =>
	bots.includes(color) ? [piece ? { color, remark, piece } : { color, remark }] : [];

// A mate found comes first, said by the side that has it, then a piece won. The piece is said
// when it is taken, never when it is left hanging, which would give it away.
function news({ heard, ply, bots, last, score }: Moment & { score: Score }): Spoken[] {
	// Whoever's move showed it: a mate often appears only once the losing side has moved into it.
	// Once a side, rather than once a verdict, so a mate found inside a cooldown is said after it.
	const mating = mateFor(score);
	if (mating && mating !== last.mating) return say({ bots, color: mating, remark: "mating" });

	const mover = moverOf(ply);
	const piece = pieceWon({ heard, ply });
	if (!piece) return [];

	const taken = say({ bots, color: mover, remark: "take", piece });
	return taken.length > 0 ? taken : say({ bots, color: other(mover), remark: "lose", piece });
}

// What a bot says about the move that made `ply`, if anything — one voice at most, so a move is
// one remark and not a dialogue — failing news, a check. Nothing about a position the game has
// left behind.
//
// A check keeps quiet inside the cooldown of any remark, but news only inside the cooldown of news:
// an attack comes with checks, and a check said must not swallow the piece or the mate it wins.
export function react(moment: Moment): Spoken[] {
	const { heard, ply, bots, livePly, last } = moment;
	const now = heard[ply];
	if (!now || !heard[ply - 1] || livePly - ply > LATE) return [];

	const said = isQuiet({ ply, lastPly: last.news })
		? []
		: news({ ...moment, score: now.verdict.score });
	if (said.length > 0 || !now.facts.check || isQuiet({ ply, lastPly: last.remark })) return said;

	return say({ bots, color: moverOf(ply), remark: "check" });
}
