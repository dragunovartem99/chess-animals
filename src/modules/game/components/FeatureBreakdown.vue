<script setup lang="ts">
import type { Chess } from "chessops/chess";
import { computed } from "vue";

import type { PhaseWeights } from "@/shared/eval";

import { explainPosition } from "../utils/breakdown";

const props = defineProps<{ position: Chess; weights: PhaseWeights; name: string }>();

const breakdown = computed(() =>
	explainPosition({ position: props.position, weights: props.weights })
);
const format = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
</script>

<template>
	<section class="breakdown">
		<h2>{{ $t("game.breakdown.title", { name }) }}</h2>
		<p class="total">
			{{ $t("game.breakdown.total") }}: <strong>{{ format(breakdown.total) }}</strong>
			<span class="phase">{{
				$t("game.breakdown.phase", { phase: (breakdown.phase * 100).toFixed(0) })
			}}</span>
		</p>

		<table>
			<thead>
				<tr>
					<th scope="col">{{ $t("game.breakdown.feature") }}</th>
					<th scope="col">{{ $t("game.breakdown.value") }}</th>
					<th scope="col">{{ $t("game.breakdown.weight") }}</th>
					<th scope="col">{{ $t("game.breakdown.points") }}</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="row in breakdown.rows"
					:key="row.key"
				>
					<td>{{ $t(row.i18nKey) }}</td>
					<td class="number">{{ format(row.value) }}</td>
					<td class="number">{{ format(row.weight) }}</td>
					<td
						class="number"
						:class="{ good: row.points > 0, bad: row.points < 0 }"
					>
						{{ format(row.points) }}
					</td>
				</tr>
			</tbody>
		</table>
	</section>
</template>

<style scoped>
.breakdown {
	font-size: 0.875rem;
}

h2 {
	margin: 0 0 0.25rem;
	font-size: 1rem;
}

.total {
	margin: 0 0 0.5rem;
}

.phase {
	margin-left: 0.5rem;
	color: var(--muted, #888);
}

table {
	width: 100%;
	border-collapse: collapse;
}

th {
	text-align: left;
	font-weight: 500;
	color: var(--muted, #888);
}

td,
th {
	padding: 0.125rem 0.25rem;
}

tbody tr:nth-child(odd) {
	background: var(--stripe, #f5f5f5);
}

.number {
	text-align: right;
	font-variant-numeric: tabular-nums;
}

.good {
	color: #2c7a3f;
}

.bad {
	color: #b03030;
}
</style>
