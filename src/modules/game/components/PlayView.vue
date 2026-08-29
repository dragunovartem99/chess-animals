<script setup lang="ts">
import type { Key } from "chessground/types";
import type { Color, Role } from "chessops/types";
import { computed, ref, watch } from "vue";

import { ChessBoard } from "@/modules/board";
import { ROSTER, ROSTER_BY_ID } from "@/modules/bots/roster";
import { compileBot } from "@/shared/bots";
import { fromUci } from "@/shared/engine/uci/moves";

import { useBotEngines } from "../composables/useBotEngines";
import { useGame } from "../composables/useGame";
import EvalBar from "./EvalBar.vue";
import FeatureBreakdown from "./FeatureBreakdown.vue";
import MoveList from "./MoveList.vue";
import PlayerPicker from "./PlayerPicker.vue";

const HUMAN = "human";

const game = useGame();
const engines = useBotEngines();

const players = ref<Record<Color, string>>({ white: HUMAN, black: "swarm-wolf" });
const score = ref<number>();

const humanColours = computed(() =>
	(["white", "black"] as Color[]).filter((colour) => players.value[colour] === HUMAN)
);
const orientation = computed(() => humanColours.value[0] ?? "white");

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

		const colour = game.position.value.turn;
		const animal = ROSTER_BY_ID.get(players.value[colour]);
		if (!animal) return;

		const answer = await engines.askForMove({ animal, fen: game.fen.value });

		// The board may have moved on while the worker was thinking — a restart, or the player
		// switching who plays which colour. Applying a stale answer would corrupt the game.
		if (turn.value !== key) return;

		const move = fromUci({ position: game.position.value, uci: answer.move });
		if (!move) return;

		// UCI reports a score from the side to move's point of view; the bar shows White-relative
		// numbers, so a black bot's opinion is flipped on the way in.
		score.value =
			answer.score === undefined
				? undefined
				: colour === "white"
					? answer.score
					: -answer.score;
		game.play(move);
	},
	{ immediate: true }
);

// The breakdown follows whoever is on move; while a human is thinking it shows their opponent,
// so the panel is never blank in a human-versus-bot game.
const lens = computed(() => {
	const onMove = ROSTER_BY_ID.get(players.value[game.position.value.turn]);
	if (onMove) return onMove;

	const other = game.position.value.turn === "white" ? "black" : "white";

	return ROSTER_BY_ID.get(players.value[other]);
});

const lensWeights = computed(() =>
	lens.value ? compileBot(lens.value.definition).weights : undefined
);

async function restart() {
	game.reset();
	score.value = undefined;
	generation.value += 1;
	await engines.startNewGame();
}
</script>

<template>
	<section class="play">
		<div class="board card">
			<EvalBar :score="score" />
			<ChessBoard
				:fen="game.fen.value"
				:orientation="orientation"
				:playable="humanColours"
				:last-move="game.lastMove.value as [Key, Key] | undefined"
				@move="playHumanMove"
			/>
		</div>

		<aside class="panel card">
			<PlayerPicker
				v-model="players"
				:roster="ROSTER"
				:human="HUMAN"
			/>

			<p class="status">
				<span v-if="game.status.value.over">
					{{ $t(`game.reason.${game.status.value.reason}`) }}
				</span>
				<span v-else-if="engines.thinking.value">{{ $t("game.thinking") }}</span>
				<span v-else>{{ $t(`game.turn.${game.position.value.turn}`) }}</span>
			</p>

			<button
				type="button"
				@click="restart"
			>
				{{ $t("game.restart") }}
			</button>

			<MoveList :turns="game.turns.value" />

			<FeatureBreakdown
				v-if="lens && lensWeights"
				:position="game.position.value"
				:weights="lensWeights"
				:played="game.played.value"
				:name="$t(`bot.${lens.definition.id}.name`)"
			/>
		</aside>
	</section>
</template>

<style scoped>
.play {
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
	align-items: flex-start;
}

.board {
	display: flex;
	gap: 0.75rem;
	align-items: stretch;
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

.status {
	margin: 0;
	min-height: 1.5rem;
	font-weight: 600;
	color: var(--color-ink-muted);
}
</style>
