<script setup lang="ts">
import type { Chess } from "chessops/chess";
import { computed } from "vue";

import type { PhaseWeights, PlayedMove } from "@/shared/eval";

import { explainPosition } from "../utils/breakdown";

const props = defineProps<{
	position: Chess;
	weights: PhaseWeights;
	name: string;
	played?: PlayedMove;
}>();

// Pawns, signed, the way an engine reports a score: `+1.20` means White is a pawn and a bit
// better. The weights are in centipawns by convention — a pawn is worth 100 — so this is only a
// change of unit, not of meaning.
const pawns = (points: number) =>
	`${points > 0 ? "+" : points < 0 ? "\u2212" : ""}${(Math.abs(points) / 100).toFixed(2)}`;

const breakdown = computed(() =>
	explainPosition({ position: props.position, weights: props.weights, played: props.played })
);
const format = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
</script>

<template>
	<section class="breakdown">
		<h2>{{ $t("game.breakdown.title", { name }) }}</h2>
		<p class="perspective">{{ $t("game.breakdown.absolute") }}</p>
		<p class="total">
			{{ $t("game.breakdown.total") }}: <strong>{{ pawns(breakdown.total) }}</strong>
			<span class="phase">{{
				$t("game.breakdown.phase", { phase: (breakdown.phase * 100).toFixed(0) })
			}}</span>
		</p>

		<table>
			<thead>
				<tr>
					<th scope="col">{{ $t("game.breakdown.feature") }}</th>
					<th scope="col">{{ $t("game.breakdown.amount") }}</th>
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

.perspective {
	margin: 0 0 0.5rem;
	color: var(--color-ink-muted);
}

.phase {
	margin-left: 0.5rem;
	color: var(--color-ink-muted);
}

table {
	width: 100%;
	border-collapse: collapse;
}

th {
	text-align: left;
	font-weight: 500;
	color: var(--color-ink-muted);
}

td,
th {
	padding: 0.125rem 0.25rem;
}

tbody tr:nth-child(odd) {
	background: var(--color-stripe);
}

/* The name is the only thing worth scanning down the left edge; the two number columns read
   better centred under their headings than ragged against the panel's right edge. */
.number,
th ~ th {
	text-align: center;
	font-variant-numeric: tabular-nums;
}

.good {
	color: var(--color-good);
}

.bad {
	color: var(--color-bad);
}
</style>
