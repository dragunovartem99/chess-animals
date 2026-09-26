import type { Stockfish } from "../monsters";
import { MATE } from "../monsters/lines";
import type { Score } from "./score";

// What the observer made of the position after `ply` moves of the game, and the reply it would
// play there, which tells a capture that holds from one about to be taken back.
export type Verdict = { ply: number; score: Score; reply?: string };

export type Observer = {
	// The verdict on the game so far, or `undefined` once the game is over or was reset while the
	// question was out.
	observe: (game: { fen: string; moves: readonly string[] }) => Promise<Verdict | undefined>;
	// A new game: whatever is still being asked about the old one is dropped.
	reset: () => void;
	dispose: () => void;
};

// Enough for Stockfish to see a hanging piece and a short mate, few enough that the lite build
// answers well inside a bot's move. Fixed rather than timed, so a game replays to the same remarks.
export const NODES = 50_000;

// A monster's line folds mate into centipawns; the observer unfolds it, because a mate is a
// remark of its own and not merely a big number.
function toScore(folded: number): Score {
	const distance = MATE - Math.abs(folded);
	if (distance < MATE / 2) return { mate: Math.sign(folded) * distance };

	return { cp: folded };
}

// Stockfish's scores are the side to move's; a verdict is White's, so a swing compares like with
// like across the plies.
function fromWhite({ score, fen, ply }: { score: number; fen: string; ply: number }): Score {
	const whiteToMove = (fen.split(" ")[1] === "w") === (ply % 2 === 0);

	return toScore(whiteToMove ? score : -score);
}

// A Stockfish of its own for the talk, never a monster's: a monster plays several lines at a
// temperature, and the commentary must not stir its state. Questions go one at a time, in order,
// because Stockfish answers one at a time.
export function createObserver({
	stockfish,
	nodes = NODES,
}: {
	stockfish: Stockfish;
	nodes?: number;
}): Observer {
	let queue: Promise<unknown> = stockfish.init();
	// Bumped by every reset, so an answer about a game that is gone is recognised as stale.
	let generation = 0;

	function observe({ fen, moves }: { fen: string; moves: readonly string[] }) {
		const asked = generation;
		const ply = moves.length;
		const answer = queue.then(async (): Promise<Verdict | undefined> => {
			if (asked !== generation) return undefined;

			const [best] = await stockfish.lines({ fen, moves, nodes, lines: 1 });
			if (!best || asked !== generation) return undefined;

			return { ply, score: fromWhite({ score: best.score, fen, ply }), reply: best.move };
		});
		// One failed question must not jam every one after it.
		queue = answer.catch(() => undefined);

		return answer;
	}

	return {
		observe,
		reset() {
			generation += 1;
			queue = queue.then(() => stockfish.newGame());
		},
		dispose: stockfish.dispose,
	};
}
