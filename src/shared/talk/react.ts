import type { Color, Role } from "chessops/types";

import type { GameResult } from "../chess";
import type { Facts } from "./facts";
import type { Verdict } from "./observer";
import type { Remark } from "./remark";
import { isQuiet, isWin, mateFor } from "./swing";

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

type Moment = {
	// Every verdict so far, by ply; the one on `verdict.ply` itself need not be among them.
	verdicts: readonly (Verdict | undefined)[];
	verdict: Verdict;
	facts: Facts;
	bots: readonly Color[];
	livePly: number;
	lastPly: number | undefined;
};

// What a bot says about the move that led to `verdict`, if anything — one voice at most, so a
// move is one remark and not a dialogue. Nothing about a position the game has left behind, and
// nothing inside the cooldown of the last remark.
//
// A mate found comes first, said by the side that has it, then a capture that netted material, then a check. A capture is judged
// over two plies, from before the move that left the piece hanging: the observer saw the gift
// coming then, so the capture itself swings nothing, and an even trade swings nothing either way.
// It is said when the piece is taken, never when it is left hanging, which would give it away.
export function react({ verdicts, verdict, facts, bots, livePly, lastPly }: Moment): Spoken[] {
	const { ply, score } = verdict;
	const before = verdicts[ply - 1];
	if (!before || livePly - ply > LATE || isQuiet({ ply, lastPly })) return [];

	// A game on `/play` starts from the opening position, so White makes the odd plies.
	const mover: Color = ply % 2 === 1 ? "white" : "black";
	const say = (color: Color, remark: Remark, piece?: Role): Spoken[] =>
		bots.includes(color) ? [piece ? { color, remark, piece } : { color, remark }] : [];

	// Whoever's move showed it: a mate often appears only once the losing side has moved into it.
	const mating = mateFor(score);
	if (mating && mateFor(before.score) !== mating) return say(mating, "mating");

	const from = (verdicts[ply - 2] ?? before).score;
	const piece = facts.captured;
	if (piece && isWin({ from, to: score, side: mover })) {
		const taken = say(mover, "take", piece);
		return taken.length > 0 ? taken : say(other(mover), "lose", piece);
	}

	return facts.check ? say(mover, "check") : [];
}
