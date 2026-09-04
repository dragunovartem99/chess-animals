<script setup lang="ts">
import type { Key } from "chessground/types";
import type { Role } from "chessops/types";
import { computed, ref } from "vue";

import { ChessBoard } from "@/modules/board";
import FeatureBreakdown from "@/modules/game/components/FeatureBreakdown.vue";
import { fromUci } from "@/shared/engine/uci/moves";
import { weightsFromRecord } from "@/shared/eval";

import { useSandbox } from "../composables/useSandbox";
import { FAMILIES, featuresByFamily } from "../utils/families";
import { FAMILY_RANGES } from "../utils/ranges";
import BoardControls from "./BoardControls.vue";
import FeatureFamilySection from "./FeatureFamilySection.vue";

const sandbox = useSandbox();
const grouped = featuresByFamily();

const TABS = ["weights", "breakdown"] as const;
const tab = ref<(typeof TABS)[number]>("weights");

const playable = computed<("white" | "black")[]>(() =>
	sandbox.autoplay.value || sandbox.thinking.value ? [] : ["white", "black"]
);

function playHumanMove({ from, to, promotion }: { from: Key; to: Key; promotion?: Role }) {
	const move = fromUci({
		position: sandbox.game.position.value,
		uci: `${from}${to}${promotion?.[0] ?? ""}`,
	});
	if (move) void sandbox.playHuman(move);
}

const vector = computed(() => weightsFromRecord(sandbox.weights.value));
const weights = computed(() => ({
	opening: vector.value,
	middlegame: vector.value,
	endgame: vector.value,
}));
</script>

<template>
	<section class="frankenstein">
		<div class="board card">
			<ChessBoard
				:fen="sandbox.game.fen.value"
				:playable="playable"
				:last-move="sandbox.game.lastMove.value as [Key, Key] | undefined"
				@move="playHumanMove"
			/>
		</div>

		<aside class="panel card">
			<BoardControls
				:weights="sandbox.weights.value"
				:depth="sandbox.depth.value"
				:quiescence="sandbox.quiescence.value"
				:autoplay="sandbox.autoplay.value"
				:thinking="sandbox.thinking.value"
				:turn="sandbox.game.position.value.turn"
				:over="sandbox.game.status.value.over ? sandbox.game.status.value : undefined"
				@depth="sandbox.setDepth"
				@quiescence="sandbox.setQuiescence"
				@seed="sandbox.seedFrom"
				@step="sandbox.step"
				@toggle-autoplay="sandbox.toggleAutoplay"
				@reset="sandbox.reset"
			/>

			<div
				class="tabs"
				role="tablist"
			>
				<button
					v-for="name in TABS"
					:key="name"
					type="button"
					role="tab"
					:aria-selected="tab === name"
					:class="{ active: tab === name }"
					@click="tab = name"
				>
					{{ $t(`frankenstein.tab.${name}`) }}
				</button>
			</div>

			<div
				v-if="tab === 'weights'"
				class="weights"
			>
				<FeatureFamilySection
					v-for="family in FAMILIES"
					:key="family"
					:family="family"
					:features="grouped[family]"
					:weights="sandbox.weights.value"
					:range="FAMILY_RANGES[family]"
					@change="(key, value) => sandbox.setWeight(key, value)"
				/>
			</div>

			<FeatureBreakdown
				v-else
				:position="sandbox.game.position.value"
				:weights="weights"
				:played="sandbox.game.played.value"
				:name="$t('frankenstein.title')"
			/>
		</aside>
	</section>
</template>

<style scoped>
.frankenstein {
	display: flex;
	flex-wrap: wrap;
	gap: 1.5rem;
	align-items: flex-start;
}

.board {
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

.weights {
	display: flex;
	flex-direction: column;
	max-height: 28rem;
	overflow-y: auto;
}

/* Mirrors `/play`'s Moves/Breakdown segmented control exactly, down to the accent choice. */
.tabs {
	display: flex;
	gap: 0.25rem;
	padding: 0.25rem;
	border-radius: var(--radius-full);
	background: var(--color-neutral-lightest);
}

.tabs button {
	flex: 1;
	padding: 0.35rem 0.75rem;
	border-radius: var(--radius-full);
	background: none;
	color: var(--color-neutral-darker);
	font-size: 0.9rem;
	box-shadow: none;
}

.tabs button:hover {
	background: var(--color-neutral-light);
}

.tabs button.active {
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: 0 1px 2px rgb(24 24 27 / 20%);
}
</style>
