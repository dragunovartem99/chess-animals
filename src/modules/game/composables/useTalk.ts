import { INITIAL_FEN } from "chessops/fen";
import { COLORS } from "chessops/types";
import type { Color } from "chessops/types";
import { computed, ref, watch } from "vue";
import type { Ref } from "vue";

import type { GameStatus } from "@/shared/chess";
import type { PlayedTurn } from "@/shared/game";
import { createConversation, farewell, greet, moveFacts } from "@/shared/talk";
import type { Line, LinesFor, Observer, Spoken } from "@/shared/talk";

import { spawnObserver, useObserver } from "./spawnObserver";

type Options = {
	// The game's moves, its position before every ply, and whether it is over.
	game: { turns: Ref<PlayedTurn[]>; fens: Ref<string[]>; status: Ref<GameStatus> };
	players: Ref<Record<Color, string>>;
	linesFor: LinesFor;
	spawn?: () => Observer;
	seed?: () => string;
};

// A fresh game's stream, as the engines get: the talk replays only where a test fixes the seed.
const randomSeed = () => crypto.randomUUID();

// What the move that made `ply` did, read from the position it was played in.
function factsOf({ turns, fens, ply }: { turns: PlayedTurn[]; fens: string[]; ply: number }) {
	const played = turns[ply - 1];
	const fen = fens[ply - 1];

	return played && fen ? moveFacts({ fen, uci: played.uci }) : { check: false };
}

// Only a bot has lines; a human, or an animal nobody has written for yet, says nothing.
const talkers = ({ players, linesFor }: { players: Record<Color, string>; linesFor: LinesFor }) =>
	COLORS.filter((color) => linesFor({ id: players[color], remark: "greet" }).length > 0);

// The talk around one game on `/play`: opt-in, so the observer's Stockfish is fetched only by
// someone who asked for it. The lines come in through `linesFor` in the language of the moment,
// which keeps the locale out of here and a test free of vue-i18n.
//
// A new game, or the panel opening, starts with hello; every move after is put to the observer,
// and the one that ends the game gets a goodbye instead.
export function useTalk(options: Options) {
	const { players, linesFor } = options;
	const { turns, fens, status } = options.game;
	const enabled = ref(false);
	const observer = useObserver({ enabled, spawn: options.spawn ?? spawnObserver });
	const said = ref<Line[]>([]);
	const bots = computed(() => talkers({ players: players.value, linesFor }));
	const conversation = createConversation({ linesFor, seed: options.seed ?? randomSeed });
	const speak = (spoken: Spoken[]) => {
		said.value = conversation.say({ spoken, players: players.value });
	};

	async function observe() {
		const moves = turns.value.map((turn) => turn.uci);
		const verdict = await observer()?.observe({ fen: INITIAL_FEN, moves });
		if (!verdict || status.value.over) return;

		const facts = factsOf({ turns: turns.value, fens: fens.value, ply: verdict.ply });
		speak(conversation.hear({ verdict, facts, bots: bots.value, livePly: turns.value.length }));
	}

	function begin() {
		observer()?.reset();
		conversation.begin();
		speak(greet(bots.value));
		void observe();
	}

	watch(enabled, (on) => {
		if (on) begin();
		else said.value = [];
	});
	watch(
		() => turns.value.length,
		(ply) => {
			if (!enabled.value || ply === 0) return;
			if (status.value.over)
				speak(farewell({ result: status.value.result, bots: bots.value }));
			else void observe();
		}
	);

	return {
		enabled,
		said,
		newGame: () => enabled.value && begin(),
	};
}
