<script setup lang="ts">
import type { Color } from "chessops/types";

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
		</label>
	</div>
</template>

<style scoped>
.players {
	display: grid;
	gap: 0.5rem;
}

label {
	display: grid;
	grid-template-columns: 4rem 1fr;
	gap: 0.5rem;
	align-items: center;
}
</style>
