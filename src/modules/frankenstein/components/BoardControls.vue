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
			class="preset"
			role="group"
			:aria-label="$t('frankenstein.settings')"
		>
			<span class="label">{{ $t("frankenstein.settings") }}</span>
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
			<!-- Quiescence is the one non-depth setting, folded into the same pill as a trailing
			     toggle: its full name is only ever in the tooltip, so the pill stays compact. -->
			<button
				type="button"
				class="quiescence"
				:class="{ active: quiescence }"
				:aria-pressed="quiescence"
				:title="$t('frankenstein.quiescence')"
				:aria-label="$t('frankenstein.quiescence')"
				@click="emit('quiescence', !quiescence)"
			>
				Q
			</button>
		</div>
	</div>

	<div class="actions">
		<button
			type="button"
			class="secondary emoji"
			:class="{ playing: autoplay }"
			:title="autoplay ? $t('frankenstein.pause') : $t('frankenstein.autoplay')"
			:aria-label="autoplay ? $t('frankenstein.pause') : $t('frankenstein.autoplay')"
			@click="emit('toggleAutoplay')"
		>
			{{ autoplay ? "⏸️" : "▶️" }}
		</button>
		<button
			type="button"
			class="secondary emoji"
			:disabled="autoplay"
			:title="$t('frankenstein.step')"
			:aria-label="$t('frankenstein.step')"
			@click="emit('step')"
		>
			⏭️
		</button>
		<button
			type="button"
			class="secondary emoji"
			:title="$t('frankenstein.reset')"
			:aria-label="$t('frankenstein.reset')"
			@click="emit('reset')"
		>
			🔄
		</button>
		<button
			v-if="isDev"
			type="button"
			class="secondary emoji"
			:title="$t('frankenstein.copy')"
			:aria-label="$t('frankenstein.copy')"
			@click="copyWeights"
		>
			📋
		</button>
	</div>

	<p class="status">
		<span v-if="over">{{ $t(`game.reason.${over.reason}`) }}</span>
		<span v-else-if="thinking">{{ $t("game.thinking") }}</span>
		<span v-else>{{ $t(`game.toMove.${turn}`) }}</span>
	</p>
</template>

<style scoped>
.preset,
.settings,
.actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

/* Preset picker and the depth pill share the first line and wrap when the panel is too narrow to
   hold both; the play buttons are their own line below. */
.preset {
	flex: 1 1 12rem;
}

.preset .seed {
	flex: 1;
	min-width: 8rem;
}

/* Icon-only buttons: the label rides along as the tooltip and the accessible name. Square them
   off and drop the wide text padding so the row reads as a control cluster, not four words. */
.actions button {
	padding: 0.4em 0.6em;
	font-size: 1.1rem;
	line-height: 1;
}

/* The running-autoplay state is the one thing worth marking on the otherwise-flat button row. */
.actions button.playing {
	border-color: var(--color-accent);
	background: var(--color-accent-veil);
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

/* The quiescence toggle rides in the same pill after a hairline divider, amber when on — the one
   place state reads as colour rather than as the lifted-out surface the depth buttons use. */
.depth .quiescence {
	margin-left: 0.15rem;
	border-left: 1px solid var(--color-neutral-lighter);
	border-radius: 0 var(--radius-full) var(--radius-full) 0;
	font-weight: 600;
}

.depth .quiescence.active {
	background: var(--color-accent);
	color: var(--color-white);
	box-shadow: none;
}

.seed {
	padding: 0.4rem 0.6rem;
}

/* Every action button is light — no solid primary. Autoplay only stands out while it is running
   (`.playing`), which is the sole state on this row worth a colour. */
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
