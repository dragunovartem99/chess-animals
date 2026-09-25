<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { ANIMALS_BY_ID } from "@/modules/bots/roster";
import type { Line } from "@/shared/talk";

import { useLines } from "../composables/useLines";
import { useVoice } from "../composables/useVoice";

const { said } = defineProps<{ said: Line[] }>();

const enabled = defineModel<boolean>({ required: true });

const animal = (id: string) => ANIMALS_BY_ID.get(id);

// Read out at render, in the language of the page as it is now.
const linesFor = useLines();
const text = (line: Line) => linesFor(line)[line.index];

// The last two remarks, whole: a bot-vs-bot game keeps the reply and what it answered.
const recent = computed(() => said.slice(-2));

const voices = useVoice({ said: computed(() => said), locale: useI18n().locale, linesFor });
</script>

<template>
	<section class="speech">
		<div class="toggles">
			<label class="toggle">
				<input
					v-model="enabled"
					type="checkbox"
				/>
				{{ $t("game.talk.toggle") }}
			</label>
			<label
				v-if="enabled"
				class="toggle"
			>
				<input
					v-model="voices"
					type="checkbox"
				/>
				{{ $t("game.talk.voices") }}
			</label>
		</div>

		<ol
			v-if="enabled"
			class="lines"
			aria-live="polite"
		>
			<li
				v-for="line in recent"
				:key="line.key"
				class="line"
			>
				<span
					class="speaker"
					:style="{ color: animal(line.id)?.tint }"
				>
					<span aria-hidden="true">{{ animal(line.id)?.emoji }}</span>
					{{ $t(`bot.${line.id}.name`) }}:
				</span>
				{{ text(line) }}
			</li>
			<li
				v-if="said.length === 0"
				class="line quiet"
			>
				{{ $t("game.talk.empty") }}
			</li>
		</ol>
	</section>
</template>

<style scoped>
.speech {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.toggles {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem 1.5rem;
}

.toggle {
	accent-color: var(--color-button);
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	color: var(--color-ink-muted);
}

/* Sized to the remarks it shows, so none is ever cut: a fixed height clipped a wrapped one
   mid-line, and a two-line floor left a blank row above a lone remark. */
.lines {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	margin: 0;
	padding: 0.5rem 0.75rem;
	list-style: none;
	line-height: 1.4;
	border-radius: 0.5rem;
	background: var(--color-sunken);
}

.speaker {
	font-weight: 600;
	margin-right: 0.25rem;
}

.quiet {
	color: var(--color-ink-muted);
}
</style>
