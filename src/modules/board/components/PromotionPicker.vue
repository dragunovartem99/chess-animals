<script setup lang="ts">
import type { Role } from "chessops/types";

// The one thing chessground cannot decide for us: a pawn reaching the last rank has four legal
// moves to the same square, and only the player knows which.
const ROLES: Role[] = ["queen", "rook", "bishop", "knight"];

defineProps<{ color: "white" | "black" }>();
const emit = defineEmits<{ pick: [Role]; cancel: [] }>();
</script>

<template>
	<div
		class="backdrop"
		@click="emit('cancel')"
	>
		<!-- `cg-wrap` is what the cburnett stylesheet keys its piece images off, so the choices
		     here are drawn with exactly the pieces standing on the board. -->
		<div
			class="picker cg-wrap"
			role="dialog"
			:aria-label="$t('board.promotion')"
		>
			<button
				v-for="role in ROLES"
				:key="role"
				type="button"
				:aria-label="$t(`board.piece.${role}`)"
				@click.stop="emit('pick', role)"
			>
				<piece :class="[role, color]" />
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
	background: rgb(24 24 27 / 55%);
}

.picker {
	display: flex;
	gap: 0.5rem;
	padding: 0.75rem;
	border-radius: var(--radius-sm);
	background: var(--color-surface);
	box-shadow: var(--shadow-card);
}

button {
	display: grid;
	place-items: center;
	width: 4rem;
	height: 4rem;
	padding: 0.25rem;
	border-radius: var(--radius-sm);
	background: var(--color-neutral-lightest);
	box-shadow: none;
	cursor: pointer;
	transition: background-color 0.15s ease;
}

button:hover {
	background: var(--color-accent-light);
}

/* Chessground positions its pieces absolutely on an 8×8 grid and sizes them off the board;
   in here they are just icons, so they get a size of their own. */
.picker piece {
	display: block;
	position: static;
	width: 3.25rem;
	height: 3.25rem;
	background-repeat: no-repeat;
	background-position: center;
	background-size: contain;
}
</style>
