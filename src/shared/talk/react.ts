import type { Color } from "chessops/types";

import type { GameResult } from "../chess";
import type { Verdict } from "./observer";
import type { Remark } from "./remark";
import { detectSwing, isQuiet } from "./swing";
import type { Swing } from "./swing";

// One bot, one remark. The line itself is picked later, from the locale.
export type Spoken = { color: Color; remark: Remark };

// How many plies behind the game a verdict may land and still be spoken. One, because a bot
// answers a human in milliseconds: the observer's verdict on the human's move always lands after
// the reply, and "thanks for the queen" said then is still on time. Two plies on, it is not.
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

// One voice per swing, so a blunder is one remark and not a dialogue. The side it went well for
// speaks when it is a bot — a gloat is the better line — and the other side only when it is not.
function cast({ swing, bots }: { swing: Swing; bots: readonly Color[] }): Spoken[] {
	const winner = swing.kind === "mate" ? swing.by : other(swing.by);
	const [happy, sad] =
		swing.kind === "mate" ? (["mating", "mated"] as const) : (["gloat", "groan"] as const);
	if (bots.includes(winner)) return [{ color: winner, remark: happy }];
	if (bots.includes(other(winner))) return [{ color: other(winner), remark: sad }];

	return [];
}

// What the bots say to a verdict on the move that led to it, if anything: nothing about a
// position the game has left behind, nothing inside the cooldown of the last remark, and nothing
// unless the move swung the game.
export function react({
	before,
	verdict,
	bots,
	livePly,
	lastPly,
}: {
	before: Verdict | undefined;
	verdict: Verdict;
	bots: readonly Color[];
	livePly: number;
	lastPly: number | undefined;
}): Spoken[] {
	if (!before || before.ply !== verdict.ply - 1 || livePly - verdict.ply > LATE) return [];
	if (isQuiet({ ply: verdict.ply, lastPly })) return [];

	// A game on `/play` starts from the opening position, so White makes the odd plies.
	const mover: Color = verdict.ply % 2 === 1 ? "white" : "black";
	const swing = detectSwing({ before: before.score, after: verdict.score, mover });

	return swing ? cast({ swing, bots }) : [];
}
