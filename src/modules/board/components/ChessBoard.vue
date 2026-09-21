<script setup lang="ts">
import type { Key } from "chessground/types";
import type { Role } from "chessops/types";
import { computed, ref, toRef } from "vue";

import { useBoardConfig } from "../composables/useBoardConfig";
import { useChessground } from "../composables/useChessground";
import { isPromotionMove } from "../utils/promotion";
import PromotionPicker from "./PromotionPicker.vue";

const {
	fen,
	orientation = "white",
	playable = [],
	lastMove,
	loading = false,
} = defineProps<{
	fen: string;
	orientation?: "white" | "black";
	playable?: ("white" | "black")[];
	lastMove?: [Key, Key];
	loading?: boolean;
}>();

const emit = defineEmits<{ move: [{ from: Key; to: Key; promotion?: Role }] }>();

const element = ref<HTMLElement>();
const pending = ref<{ from: Key; to: Key }>();

function play({ from, to }: { from: Key; to: Key }) {
	if (isPromotionMove({ fen, from, to })) {
		pending.value = { from, to };
		return;
	}

	emit("move", { from, to });
}

function promote(role: Role) {
	if (pending.value) emit("move", { ...pending.value, promotion: role });
	pending.value = undefined;
}

const config = useBoardConfig({
	fen: toRef(() => fen),
	orientation: toRef(() => orientation),
	playable: toRef(() => playable),
	lastMove: toRef(() => lastMove),
	onMove: play,
});

const api = useChessground({ element, config });

// Chessground has already moved the pawn by the time the picker opens, and the FEN it was given
// has not changed, so no watcher will redraw it: the position has to be put back by hand.
function cancel() {
	pending.value = undefined;
	api.value?.set(config.value);
}

// Reuse the parse `useBoardConfig` already did rather than parsing the FEN a second time here —
// only the promotion picker reads it, for the colour of the pieces it offers.
const turn = computed(() => config.value.turnColor ?? "white");
</script>

<template>
	<div
		class="board"
		:aria-busy="loading"
	>
		<div
			ref="element"
			class="ground"
		/>
		<!-- Words are the page's to say, in its status line: the board speaks no locale. -->
		<div
			v-if="loading"
			class="loading"
		>
			<span class="spinner" />
		</div>
		<PromotionPicker
			v-if="pending"
			:color="turn"
			@pick="promote"
			@cancel="cancel"
		/>
	</div>
</template>

<style scoped>
.board {
	position: relative;
	aspect-ratio: 1;
	width: 100%;
	max-width: 32rem;
}

.ground {
	width: 100%;
	height: 100%;
}

.loading {
	position: absolute;
	inset: 0;
	/* Over chessground's pieces, as the promotion picker is — see its z-index. */
	z-index: 20;
	display: grid;
	place-items: center;
	/* Fixed, not a theme token: the backdrop is dark in either world. */
	color: #fff;
	background: rgb(24 24 27 / 55%);
}

.spinner {
	width: 2.5rem;
	height: 2.5rem;
	border: 0.25rem solid currentcolor;
	border-right-color: transparent;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(1turn);
	}
}

@media (prefers-reduced-motion: reduce) {
	.spinner {
		animation-duration: 3s;
	}
}
</style>
