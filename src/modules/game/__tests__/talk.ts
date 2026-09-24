import { INITIAL_FEN } from "chessops/fen";
import type { Color } from "chessops/types";
import { vi } from "vitest";
import { nextTick, ref } from "vue";

import { afterMove, fenFromPosition, positionFromFen } from "@/shared/chess";
import type { GameStatus } from "@/shared/chess";
import { fromUci } from "@/shared/engine/uci/moves";
import type { PlayedTurn } from "@/shared/game";
import type { LinesFor, Observer, Score } from "@/shared/talk";
import { withSetup } from "@/shared/test-support/component";

import { useTalk } from "../composables/useTalk";

// Two lines a remark for the donkey and the wolf, the piece named in them; none for anyone else.
const linesFor: LinesFor = ({ id, remark, piece = "" }) =>
	["donkey", "wolf"].includes(id)
		? [`${id} ${remark}${piece} 1`, `${id} ${remark}${piece} 2`]
		: [];

// An observer that knows the verdict on every ply in advance, level unless told otherwise.
function fakeObserver(scores: Score[]) {
	const calls = { reset: 0, dispose: 0 };
	const observer: Observer = {
		observe: ({ moves }) =>
			Promise.resolve({ ply: moves.length, score: scores[moves.length] ?? { cp: 0 } }),
		reset: () => {
			calls.reset += 1;
		},
		dispose: () => {
			calls.dispose += 1;
		},
	};

	return { observer, calls };
}

// The turns and positions of a game played from the opening position.
function replay(moves: readonly string[]) {
	let position = positionFromFen(INITIAL_FEN);
	const fens = [INITIAL_FEN];
	const turns = moves.map((uci, index): PlayedTurn => {
		position = afterMove({ position, move: fromUci({ position, uci })! });
		fens.push(fenFromPosition(position));
		return { ply: index + 1, san: uci, uci };
	});

	return { turns, fens };
}

const settle = async () => {
	await nextTick();
	await new Promise((resolve) => {
		setTimeout(resolve);
	});
};

// `useTalk` over a game the test plays by hand, on a fixed seed.
export function mountTalk({ white = "human", black = "donkey", scores = [] as Score[] } = {}) {
	const game = {
		turns: ref<PlayedTurn[]>([]),
		fens: ref([INITIAL_FEN]),
		status: ref<GameStatus>({ over: false }),
	};
	const players = ref<Record<Color, string>>({ white, black });
	const { observer, calls } = fakeObserver(scores);
	const spawn = vi.fn<() => Observer>(() => observer);
	const setup = withSetup(() => useTalk({ game, players, linesFor, spawn, seed: () => "talk" }));
	const talk = setup.result;

	return {
		...setup,
		talk,
		status: game.status,
		spawn,
		calls,
		texts: () => talk.said.value.map((line) => linesFor(line)[line.index]),
		switchOn: async () => {
			talk.enabled.value = true;
			await nextTick();
		},
		// One move at a time from where the game stands, as a game is played.
		play: async (moves: readonly string[]) => {
			const { turns, fens } = replay(moves);
			const plies = turns.slice(game.turns.value.length).map((turn) => turn.ply);
			await plies.reduce(async (done, ply) => {
				await done;
				game.fens.value = fens.slice(0, ply + 1);
				game.turns.value = turns.slice(0, ply);
				await settle();
			}, Promise.resolve());
		},
	};
}
