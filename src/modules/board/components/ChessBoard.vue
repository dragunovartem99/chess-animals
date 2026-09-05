<script setup lang="ts">
import type { Key } from "chessground/types";
import type { Role } from "chessops/types";
import { computed, ref, toRef } from "vue";

import { useBoardConfig } from "../composables/useBoardConfig";
import { useChessground } from "../composables/useChessground";
import { isPromotionMove } from "../utils/promotion";
import PromotionPicker from "./PromotionPicker.vue";

const props = withDefaults(
	defineProps<{
		fen: string;
		orientation?: "white" | "black";
		playable?: ("white" | "black")[];
		lastMove?: [Key, Key];
	}>(),
	{ orientation: "white", playable: () => [], lastMove: undefined }
);

const emit = defineEmits<{ move: [{ from: Key; to: Key; promotion?: Role }] }>();

const element = ref<HTMLElement>();
const pending = ref<{ from: Key; to: Key }>();

function play({ from, to }: { from: Key; to: Key }) {
	if (isPromotionMove({ fen: props.fen, from, to })) {
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
	fen: toRef(props, "fen"),
	orientation: toRef(props, "orientation"),
	playable: toRef(props, "playable"),
	lastMove: toRef(props, "lastMove"),
	onMove: play,
});

useChessground({ element, config });

// Reuse the parse `useBoardConfig` already did rather than parsing the FEN a second time here —
// only the promotion picker reads it, for the colour of the pieces it offers.
const turn = computed(() => config.value.turnColor ?? "white");
</script>

<template>
	<div class="board">
		<div
			ref="element"
			class="ground"
		/>
		<PromotionPicker
			v-if="pending"
			:color="turn"
			@pick="promote"
			@cancel="pending = undefined"
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
</style>
