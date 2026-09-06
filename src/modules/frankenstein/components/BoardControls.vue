<script setup lang="ts">
import { ROSTER } from "@/modules/bots/roster";
import { recordFromWeights, weightsFromRecord } from "@/shared/eval";

import { MAX_DEPTH } from "../utils/presets";

const props = defineProps<{
	weights: Record<string, number>;
	depth: number;
	quiescence: boolean;
	autoplay: boolean;
	thinking: boolean;
	turn: "white" | "black";
	over?: { reason: string };
}>();
const emit = defineEmits<{
	depth: [number];
	quiescence: [boolean];
	seed: [string | undefined];
	step: [];
	toggleAutoplay: [];
	reset: [];
}>();

const DEPTH_LEVELS = Array.from({ length: MAX_DEPTH }, (_, index) => index + 1);

// A dev-only escape hatch for pulling a tuned weight set out of the sandbox and into a roster
// file by hand — `import.meta.env.DEV` strips both the button and this function from the
// production build, so nothing here needs to be a shipped feature. Read into a local rather than
// used as `import.meta.env.DEV` directly in the template: the template expression parser does not
// accept `import.meta` syntax.
const isDev = import.meta.env.DEV;

async function copyWeights() {
	const sparse = recordFromWeights(weightsFromRecord(props.weights));
	await navigator.clipboard.writeText(JSON.stringify(sparse, null, 2));
}
</script>

<template>
	<div class="settings">
		<div
			class="depth"
			role="group"
			:aria-label="$t('frankenstein.depth')"
		>
			<span class="label">{{ $t("frankenstein.depth") }}</span>
			<button
				v-for="level in DEPTH_LEVELS"
				:key="level"
				type="button"
				:class="{ active: depth === level }"
				@click="emit('depth', level)"
			>
				{{ level }}
			</button>
		</div>

		<label class="checkbox">
			<input
				type="checkbox"
				:checked="quiescence"
				@change="emit('quiescence', ($event.target as HTMLInputElement).checked)"
			/>
			{{ $t("frankenstein.quiescence") }}
		</label>

		<select
			class="seed"
			@change="emit('seed', ($event.target as HTMLSelectElement).value || undefined)"
		>
			<option value="">🧟 {{ $t("frankenstein.seed.blank") }}</option>
			<option
				v-for="animal in ROSTER"
				:key="animal.definition.id"
				:value="animal.definition.id"
			>
				{{ animal.emoji }} {{ $t(`bot.${animal.definition.id}.name`) }}
			</option>
		</select>
	</div>

	<div class="actions">
		<button
			type="button"
			@click="emit('toggleAutoplay')"
		>
			{{ autoplay ? $t("frankenstein.pause") : $t("frankenstein.autoplay") }}
		</button>
		<button
			type="button"
			class="secondary"
			:disabled="autoplay"
			@click="emit('step')"
		>
			{{ $t("frankenstein.step") }}
		</button>
		<button
			type="button"
			class="secondary"
			@click="emit('reset')"
		>
			{{ $t("frankenstein.reset") }}
		</button>
		<button
			v-if="isDev"
			type="button"
			class="secondary"
			@click="copyWeights"
		>
			{{ $t("frankenstein.copy") }}
		</button>
	</div>

	<p class="status">
		<span v-if="over">{{ $t(`game.reason.${over.reason}`) }}</span>
		<span v-else-if="thinking">{{ $t("game.thinking") }}</span>
		<span v-else>{{ $t(`game.toMove.${turn}`) }}</span>
	</p>
</template>

<style scoped>
.settings,
.actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

.label {
	color: var(--color-ink-muted);
	font-size: 0.85rem;
}

/* A segmented pill, the same shape as the weights/breakdown tabs, so 1/2/3 reads as one control
   rather than three more buttons competing with autoplay/step/reset for attention. */
.depth {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.2rem 0.2rem 0.2rem 0.6rem;
	border-radius: var(--radius-full);
	background: var(--color-sunken);
}

.depth button {
	min-width: 1.75rem;
	padding: 0.3em 0.6em;
	border-radius: var(--radius-full);
	background: none;
	color: var(--color-neutral-darker);
	box-shadow: none;
}

.depth button:hover {
	background: var(--color-stripe);
}

.depth button.active {
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: 0 1px 2px rgb(24 24 27 / 20%);
}

.checkbox {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.9rem;
	color: var(--color-ink-muted);
}

.checkbox input {
	accent-color: var(--color-accent);
}

.seed {
	padding: 0.4rem 0.6rem;
}

/* Autoplay is the one action worth a full solid button; step/reset/copy are lighter so the row
   reads as one primary action plus a few incidental ones, not five equally loud buttons. */
.secondary {
	background: none;
	color: var(--color-ink-muted);
	box-shadow: none;
	border: 1px solid var(--color-border);
}

.secondary:hover {
	background: var(--color-stripe);
	color: var(--color-ink);
}

/* Always rendered, never `v-if`-toggled: swapping only the text inside a fixed-height line is
   what keeps "Thinking…" from flickering the layout in and out on every move. */
.status {
	margin: 0.5rem 0 0;
	min-height: 1.25rem;
	color: var(--color-ink-muted);
	font-weight: 600;
}
</style>
