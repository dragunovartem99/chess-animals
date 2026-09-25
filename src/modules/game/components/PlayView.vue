<script setup lang="ts">
import type { Key } from "chessground/types";
import { COLORS } from "chessops/types";
import type { Role } from "chessops/types";
import { computed, ref, watch } from "vue";

import { ChessBoard } from "@/modules/board";
import { ANIMALS_BY_ID, MONSTERS, ROSTER, UNDERWATER } from "@/modules/bots/roster";
import { fromUci } from "@/shared/engine/uci/moves";
import { useGame } from "@/shared/game";
import { useTheme } from "@/shared/ui";

import { useBotEngines } from "../composables/useBotEngines";
import { useHistory } from "../composables/useHistory";
import { useLines } from "../composables/useLines";
import { usePace } from "../composables/usePace";
import { usePlayers } from "../composables/usePlayers";
import { useTalk } from "../composables/useTalk";
import HistoryControls from "./HistoryControls.vue";
import MoveList from "./MoveList.vue";
import PlayerPicker from "./PlayerPicker.vue";
import SpeechPanel from "./SpeechPanel.vue";

const HUMAN = "human";

const game = useGame();
const engines = useBotEngines();

const players = usePlayers({
	defaults: { white: HUMAN, black: "fox" },
	onQueryChange: restart,
});

// Into a roster's world for as long as one of its animals is at the board, whoever picked it — the
// monsters' first, when an underwater animal plays one, as the stronger of the two.
const WORLDS = [
	{ theme: "monsters", ids: new Set(MONSTERS.map((animal) => animal.definition.id)) },
	{ theme: "sea", ids: new Set(UNDERWATER.map((animal) => animal.definition.id)) },
] as const;
useTheme(
	() => WORLDS.find(({ ids }) => Object.values(players.value).some((id) => ids.has(id)))?.theme
);

const talk = useTalk({ game, players, linesFor: useLines() });
const pace = usePace({ players, isBot: (id) => ANIMALS_BY_ID.has(id) });

const humanColors = computed(() => COLORS.filter((color) => players.value[color] === HUMAN));
const orientation = computed(() => humanColors.value[0] ?? "white");

const history = useHistory({ fens: game.fens, turns: game.turns });

// A finished game is a view, not a position to move from: `game.play` already rejects the move,
// but the board only resyncs on a FEN change, so a drop after the result would otherwise linger.
// A past position is only a view as well — a move from it would be played on the current one.
const playable = computed(() =>
	game.status.value.over || engines.loading.value || !history.live.value ? [] : humanColors.value
);

// Every bot at the board is started as soon as it is picked, not on its first move: the board
// waits behind one loading state for all of them rather than stalling mid-game on a fetch.
watch(
	() => COLORS.map((color) => players.value[color]),
	(ids) => {
		const animals = ids.flatMap((id) => ANIMALS_BY_ID.get(id) ?? []);
		void engines.prepare(animals);
	},
	{ immediate: true }
);

function playHumanMove({ from, to, promotion }: { from: Key; to: Key; promotion?: Role }) {
	const move = fromUci({
		position: game.position.value,
		uci: `${from}${to}${promotion?.[0] ?? ""}`,
	});
	if (move) game.play(move);
}

// Bumped by `restart`, so a new game from an unchanged board still counts as a new turn.
const generation = ref(0);

// Everything that means "somebody new is on move". Watching the FEN alone was not enough, and
// the two ways it fell short were both real:
//
//   - `players` is a ref holding an object, and the picker mutates a property of it. The ref's
//     identity never changes, so a watcher on it never fired — choosing a bot for White did
//     nothing at all until a human move happened to change the FEN.
//   - Restarting from the opening position leaves the FEN exactly as it was, so a bot playing
//     White would sit there after "New game".
//
// The ply is in the key too: the same position can legitimately come round twice.
const turn = computed(() =>
	[
		generation.value,
		game.ply.value,
		game.fen.value,
		players.value.white,
		players.value.black,
	].join("|")
);

// Whoever is to move gets asked for a move. A human is asked by being allowed to drag; a bot is
// asked over UCI. This watch is the whole game loop.
watch(
	turn,
	async (key) => {
		if (game.status.value.over) return;

		const color = game.position.value.turn;
		const animal = ANIMALS_BY_ID.get(players.value[color]);
		if (!animal) return;

		await pace();
		if (turn.value !== key) return;

		// The move list, not just the FEN: the engine rebuilds the repetition history from it, so
		// without it a bot-vs-bot game is blind to threefold and can only end at the
		// ply cap.
		const answer = await engines.askForMove({
			animal,
			moves: game.turns.value.map((played) => played.uci),
		});

		// The board may have moved on while the worker was thinking — a restart, or the player
		// switching who plays which color. Applying a stale answer would corrupt the game.
		if (turn.value !== key) return;

		const move = fromUci({ position: game.position.value, uci: answer.move });
		if (!move) return;

		game.play(move);
	},
	{ immediate: true }
);

// Both seats at once, in one assignment, so the URL is written once. A new game with it: the
// players trade the pieces they started with, not a position half played by the other side.
function swapColors() {
	const { white, black } = players.value;
	players.value = { white: black, black: white };
	void restart();
}

async function restart() {
	game.reset();
	history.last();
	generation.value += 1;
	talk.newGame();
	await engines.startNewGame();
}
</script>

<template>
	<section class="play">
		<div class="board card">
			<ChessBoard
				:fen="history.fen.value"
				:orientation="orientation"
				:playable="playable"
				:last-move="history.lastMove.value"
				:loading="engines.loading.value"
				@move="playHumanMove"
			/>
		</div>

		<aside class="panel card">
			<PlayerPicker
				v-model="players"
				:land="ROSTER"
				:underwater="UNDERWATER"
				:monsters="MONSTERS"
				:human="HUMAN"
			/>

			<p class="status">
				<span v-if="game.status.value.over">
					{{ $t(`game.reason.${game.status.value.reason}`) }}
				</span>
				<span v-else-if="engines.loading.value">{{ $t("game.loading") }}</span>
				<span v-else>{{ $t(`game.toMove.${game.position.value.turn}`) }}</span>
			</p>

			<div class="actions">
				<button
					type="button"
					@click="restart"
				>
					{{ $t("game.restart") }}
				</button>
				<button
					type="button"
					class="swap"
					@click="swapColors"
				>
					<span aria-hidden="true">⇅</span> {{ $t("game.swap") }}
				</button>
			</div>

			<SpeechPanel
				v-model="talk.enabled.value"
				:said="talk.said.value"
			/>

			<MoveList
				class="moves"
				:turns="game.turns.value"
				:current="history.viewed.value"
				@navigate="history.goTo"
			/>

			<HistoryControls
				:can-go-back="history.viewed.value > 0"
				:can-go-forward="!history.live.value"
				:turns="game.turns.value"
				:status="game.status.value"
				:players="players"
				:human="HUMAN"
				@step="(step) => history[step]()"
			/>
		</aside>
	</section>
</template>

<style scoped>
.play {
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
}

.board {
	align-self: flex-start;
	flex: 1 1 24rem;
	max-width: 36rem;
}

.panel {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	flex: 1 1 18rem;
	min-width: 16rem;
}

/* A fixed box from the first move, so the controls under it never drift down as the game grows.
   Beside the board the panel stretches to the board's height and the list takes what is left;
   stacked under it on a phone there is nothing to stretch to, and the basis is the height. The
   floor is low so the talk box can open without making the panel taller than the board. */
.moves {
	flex: 1 1 12rem;
	min-height: 4rem;
}

.actions {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 0.5rem;
}

.swap {
	background: var(--color-sunken);
	color: var(--color-ink);
	box-shadow: none;
}

.swap:hover {
	background: var(--color-border);
}

.status {
	margin: 0;
	min-height: 1.5rem;
	font-weight: 600;
	color: var(--color-ink-muted);
}
</style>
