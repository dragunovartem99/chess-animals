<script setup lang="ts">
import { computed } from "vue";

import type { PlayedTurn } from "@/shared/game";

const props = defineProps<{ turns: PlayedTurn[] }>();

// Chess counts in full moves: White's and Black's replies share a number.
const rows = computed(() =>
	props.turns.reduce<{ number: number; white?: PlayedTurn; black?: PlayedTurn }[]>(
		(acc, turn) => {
			const number = Math.ceil(turn.ply / 2);
			const row =
				acc.at(-1)?.number === number ? acc.at(-1)! : (acc.push({ number }), acc.at(-1)!);

			if (turn.ply % 2 === 1) row.white = turn;
			else row.black = turn;

			return acc;
		},
		[]
	)
);
</script>

<template>
	<ol class="moves">
		<li
			v-for="row in rows"
			:key="row.number"
		>
			<span class="number">{{ row.number }}.</span>
			<span class="san">{{ row.white?.san }}</span>
			<span class="san">{{ row.black?.san }}</span>
		</li>
	</ol>
</template>

<style scoped>
.moves {
	max-height: 20rem;
	overflow-y: auto;
	margin: 0;
	padding: 0;
	list-style: none;
	font-variant-numeric: tabular-nums;
}

li {
	display: grid;
	grid-template-columns: 2.5rem 1fr 1fr;
	gap: 0.5rem;
	padding: 0.125rem 0.25rem;
}

li:nth-child(odd) {
	background: var(--color-stripe);
}

.number {
	color: var(--color-ink-muted);
}
</style>
