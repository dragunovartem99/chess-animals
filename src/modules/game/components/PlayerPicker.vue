<script setup lang="ts">
import type { Color } from "chessops/types";

import type { Animal } from "@/modules/bots/roster";

defineProps<{ roster: Animal[]; human: string }>();
const players = defineModel<Record<Color, string>>({ required: true });

const COLOURS: Color[] = ["white", "black"];
</script>

<template>
	<div class="players">
		<label
			v-for="colour in COLOURS"
			:key="colour"
		>
			<span>{{ $t(`game.turn.${colour}`) }}</span>
			<select v-model="players[colour]">
				<option :value="human">{{ $t("game.human") }}</option>
				<option
					v-for="animal in roster"
					:key="animal.definition.id"
					:value="animal.definition.id"
				>
					{{ animal.emoji }} {{ $t(`bot.${animal.definition.id}.name`) }}
				</option>
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
