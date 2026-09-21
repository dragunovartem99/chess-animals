<script setup lang="ts">
import type { Color } from "chessops/types";

import { pointsOf } from "@/modules/bots/roster";
import type { Animal } from "@/modules/bots/roster";

defineProps<{ land: Animal[]; underwater: Animal[]; monsters: Animal[]; human: string }>();
const players = defineModel<Record<Color, string>>({ required: true });

const COLORS: Color[] = ["white", "black"];
// One select, three groups, in the order the site lists the rosters.
const GROUPS = ["land", "underwater", "monsters"] as const;
</script>

<template>
	<div class="players">
		<label
			v-for="color in COLORS"
			:key="color"
		>
			<span>{{ $t(`game.turn.${color}`) }}</span>
			<select v-model="players[color]">
				<option :value="human">{{ $t("game.human") }}</option>
				<optgroup
					v-for="group in GROUPS"
					:key="group"
					:label="$t(`game.group.${group}`)"
				>
					<option
						v-for="animal in $props[group]"
						:key="animal.definition.id"
						:value="animal.definition.id"
					>
						{{ animal.emoji }} {{ $t(`bot.${animal.definition.id}.name`) }}
					</option>
				</optgroup>
			</select>
			<!-- Beside the select, not in its options: a native option is plain text, and a number
			     in it reads as clutter. Empty for a person, so the rows stay aligned. -->
			<span
				class="points"
				:class="{ empty: pointsOf(players[color]) === undefined }"
				:aria-label="
					pointsOf(players[color]) === undefined
						? undefined
						: $t('roster.points', { points: pointsOf(players[color]) })
				"
			>
				<template v-if="pointsOf(players[color]) !== undefined">
					<span aria-hidden="true">★</span> {{ pointsOf(players[color]) }}
				</template>
			</span>
		</label>
	</div>
</template>

<style scoped>
/* The rows share one set of columns through subgrid, so the label column fits the longer of
   "White"/"Black" in any locale and the badges come out one width, instead of each hugging its
   own number with a ragged gap before it. */
.players {
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 0.5rem;
}

label {
	display: grid;
	grid-column: 1 / -1;
	grid-template-columns: subgrid;
	align-items: center;
}

.points {
	text-align: center;
	padding: 0.1rem 0.5rem;
	border-radius: var(--radius-full);
	background: var(--color-sunken);
	color: var(--color-ink-muted);
	font-size: 0.85rem;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.points.empty {
	visibility: hidden;
}
</style>
