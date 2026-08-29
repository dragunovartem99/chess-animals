<script setup lang="ts">
import type { Role } from "chessops/types";

// The one thing chessground cannot decide for us: a pawn reaching the last rank has four legal
// moves to the same square, and only the player knows which.
const PIECES: { role: Role; white: string; black: string }[] = [
	{ role: "queen", white: "♕", black: "♛" },
	{ role: "rook", white: "♖", black: "♜" },
	{ role: "bishop", white: "♗", black: "♝" },
	{ role: "knight", white: "♘", black: "♞" },
];

defineProps<{ color: "white" | "black" }>();
const emit = defineEmits<{ pick: [Role]; cancel: [] }>();
</script>

<template>
	<div
		class="backdrop"
		@click="emit('cancel')"
	>
		<div
			class="picker"
			role="dialog"
			:aria-label="$t('board.promotion')"
		>
			<button
				v-for="piece in PIECES"
				:key="piece.role"
				type="button"
				:aria-label="$t(`board.piece.${piece.role}`)"
				@click.stop="emit('pick', piece.role)"
			>
				{{ color === "white" ? piece.white : piece.black }}
			</button>
		</div>
	</div>
</template>

<style scoped>
.backdrop {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	background: rgb(0 0 0 / 45%);
}

.picker {
	display: flex;
	gap: 0.25rem;
	padding: 0.5rem;
	border-radius: 0.5rem;
	background: var(--surface, #fff);
}

button {
	width: 3rem;
	height: 3rem;
	font-size: 2rem;
	line-height: 1;
	cursor: pointer;
	border: 1px solid var(--border, #ccc);
	border-radius: 0.25rem;
	background: transparent;
}

button:hover {
	background: var(--hover, #eee);
}
</style>
