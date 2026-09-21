<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import type { PlayedTurn } from "@/shared/game";

import { figurine } from "../utils/figurine";

const { turns, current } = defineProps<{ turns: PlayedTurn[]; current: number }>();

const emit = defineEmits<{ navigate: [number] }>();

// Chess counts in full moves: White's and Black's replies share a number.
const rows = computed(() =>
	turns.reduce<{ number: number; white?: PlayedTurn; black?: PlayedTurn }[]>((acc, turn) => {
		const number = Math.ceil(turn.ply / 2);
		const row =
			acc.at(-1)?.number === number ? acc.at(-1)! : (acc.push({ number }), acc.at(-1)!);

		if (turn.ply % 2 === 1) row.white = turn;
		else row.black = turn;

		return acc;
	}, [])
);

const list = ref<HTMLElement>();

// The list scrolls itself rather than asking the move to `scrollIntoView`, which walks every
// scrollable ancestor: on a phone, where the page is what scrolls, each bot move would drag the
// board out from under the player's thumb.
watch(
	() => [current, turns.length],
	async () => {
		await nextTick();

		const move = list.value?.querySelector("[aria-current]");
		if (!list.value || !move) return;

		const box = list.value.getBoundingClientRect();
		const moveBox = move.getBoundingClientRect();
		list.value.scrollTop += moveBox.top - box.top - (box.height - moveBox.height) / 2;
	}
);
</script>

<template>
	<ol
		ref="list"
		class="moves"
	>
		<li
			v-for="row in rows"
			:key="row.number"
		>
			<span class="number">{{ row.number }}.</span>
			<template
				v-for="turn in [row.white, row.black]"
				:key="turn?.ply"
			>
				<button
					v-if="turn"
					type="button"
					class="san"
					:aria-current="turn.ply === current ? 'true' : undefined"
					@click="emit('navigate', turn.ply)"
				>
					{{ figurine(turn) }}
				</button>
			</template>
		</li>
	</ol>
</template>

<style scoped>
.moves {
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

.san {
	justify-content: flex-start;
	padding: 0 0.375rem;
	border-radius: var(--radius-sm);
	font-weight: 400;
	color: var(--color-ink);
	background: none;
	box-shadow: none;
	transition: none;
}

.san:hover {
	background: var(--color-sunken);
}

.san:active {
	transform: none;
}

.san[aria-current] {
	font-weight: 700;
	/* The board's last-move tint, so the eye pairs the move in the list with the squares it lit. */
	background: var(--color-last-move);
}
</style>
