import { COLORS } from "chessops/types";
import type { Color } from "chessops/types";
import { computed, ref, watch } from "vue";
import type { Ref } from "vue";

import type { GameStatus } from "@/shared/chess";
import type { PlayedTurn } from "@/shared/game";
import { createConversation, farewell, greet, moveFacts } from "@/shared/talk";
import type { Line, LinesFor, Spoken } from "@/shared/talk";
import { useStoredFlag } from "@/shared/ui";

type Options = {
	// The game's moves, its position before every ply, and whether it is over.
	game: { turns: Ref<PlayedTurn[]>; fens: Ref<string[]>; status: Ref<GameStatus> };
	players: Ref<Record<Color, string>>;
	linesFor: LinesFor;
	seed?: () => string;
};

// A fresh game's stream, as the engines get: the talk replays only where a test fixes the seed.
const randomSeed = () => crypto.randomUUID();

// Only a bot has lines; a human, or an animal nobody has written for yet, says nothing.
const talkers = ({ players, linesFor }: { players: Record<Color, string>; linesFor: LinesFor }) =>
	COLORS.filter((color) => linesFor({ id: players[color], remark: "greet" }).length > 0);

// Lines come through `linesFor` in the current language, keeping the locale — and vue-i18n — out of
// here and out of the tests.
export function useTalk(options: Options) {
	const { players, linesFor } = options;
	const { turns, fens, status } = options.game;
	const enabled = useStoredFlag("chess-animals:talk");
	const said = ref<Line[]>([]);
	const bots = computed(() => talkers({ players: players.value, linesFor }));
	const conversation = createConversation({ linesFor, seed: options.seed ?? randomSeed });
	const speak = (spoken: Spoken[]) => {
		said.value = conversation.say({ spoken, players: players.value });
	};

	function hear(ply: number) {
		const moves = turns.value.map((turn) => turn.uci);
		const facts = moveFacts({ fens: fens.value, moves, ply });
		said.value = conversation.hear({ ply, facts, bots: bots.value, players: players.value });
	}

	function begin() {
		conversation.begin();
		speak(greet(bots.value));
	}

	// The panel hides what was said while it is off, and a fresh hello replaces it when it opens.
	watch(enabled, (on) => on && begin(), { immediate: true });
	watch(
		() => turns.value.length,
		(ply) => {
			if (!enabled.value || ply === 0) return;
			if (status.value.over)
				speak(farewell({ result: status.value.result, bots: bots.value }));
			else hear(ply);
		}
	);

	return {
		enabled,
		said,
		newGame: () => enabled.value && begin(),
	};
}
