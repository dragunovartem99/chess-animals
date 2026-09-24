<script setup lang="ts">
import { ANIMALS_BY_ID } from "@/modules/bots/roster";
import type { Line } from "@/shared/talk";

const { said } = defineProps<{ said: Line[] }>();

const enabled = defineModel<boolean>({ required: true });

const animal = (id: string) => ANIMALS_BY_ID.get(id);
</script>

<template>
	<section class="speech">
		<label class="toggle">
			<input
				v-model="enabled"
				type="checkbox"
			/>
			{{ $t("game.talk.toggle") }}
		</label>

		<ol
			v-if="enabled"
			class="lines"
			aria-live="polite"
		>
			<li
				v-for="line in said"
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
				{{ line.text }}
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

.toggle {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	color: var(--color-ink-muted);
}

/* A fixed box, the newest remark at the bottom and an older one clipped off the top, so the
   panel never changes height as the bots talk. */
.lines {
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	gap: 0.25rem;
	height: 4.25rem;
	overflow: hidden;
	margin: 0;
	padding: 0.5rem 0.75rem;
	list-style: none;
	border-radius: 0.5rem;
	background: var(--color-sunken);
}

.line {
	line-height: 1.4;
}

.speaker {
	font-weight: 600;
	margin-right: 0.25rem;
}

.quiet {
	color: var(--color-ink-muted);
}
</style>
