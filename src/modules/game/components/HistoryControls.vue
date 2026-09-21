<script setup lang="ts">
import type { Color } from "chessops/types";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import type { GameStatus } from "@/shared/chess";
import type { PlayedTurn } from "@/shared/game";

import { toPgn } from "../utils/pgn";

type Step = "first" | "previous" | "next" | "last";

const { canGoBack, canGoForward, turns, status, players, human } = defineProps<{
	canGoBack: boolean;
	canGoForward: boolean;
	turns: PlayedTurn[];
	status: GameStatus;
	players: Record<Color, string>;
	human: string;
}>();

const emit = defineEmits<{ step: [Step] }>();

// Stroked paths on a 24-unit grid, drawn inline so every glyph is the same size and weight —
// the unicode media arrows came in at a different size per font and per glyph.
const ICONS: Record<Step | "copy" | "copied", string[]> = {
	first: ["M11 7l-5 5l5 5", "M17 7l-5 5l5 5"],
	previous: ["M15 6l-6 6l6 6"],
	next: ["M9 6l6 6l-6 6"],
	last: ["M7 7l5 5l-5 5", "M13 7l5 5l-5 5"],
	copy: [
		"M8 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z",
		"M16 8v-2a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2",
	],
	copied: ["M5 12l5 5l10-10"],
};

const STEPS = computed(
	() =>
		[
			{ step: "first", enabled: canGoBack },
			{ step: "previous", enabled: canGoBack },
			{ step: "next", enabled: canGoForward },
			{ step: "last", enabled: canGoForward },
		] as const
);

const KEYS: Record<string, Step> = {
	ArrowLeft: "previous",
	ArrowRight: "next",
	Home: "first",
	End: "last",
};

// On the window, so the arrows work wherever the player's focus happens to be — except in a
// control that has its own use for them, like the bot pickers.
function onKeydown(event: KeyboardEvent) {
	const step = KEYS[event.key];
	const target = event.target as HTMLElement | null;
	if (!step || event.altKey || event.ctrlKey || event.metaKey) return;
	if (target?.closest("input, select, textarea")) return;

	event.preventDefault();
	emit("step", step);
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

const { t } = useI18n();
const name = (id: string) => (id === human ? t("game.human") : t(`bot.${id}.name`));

// Built on the click rather than kept up to date: nothing reads it in between.
async function copy() {
	const { white, black } = players;
	await navigator.clipboard.writeText(
		toPgn({ turns, status, white: name(white), black: name(black) })
	);
	copied.value = true;
	clearTimeout(timer);
	timer = setTimeout(() => (copied.value = false), 1500);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
	<div class="controls">
		<button
			v-for="{ step, enabled } in STEPS"
			:key="step"
			type="button"
			:disabled="!enabled"
			:aria-label="$t(`game.history.${step}`)"
			:title="$t(`game.history.${step}`)"
			@click="emit('step', step)"
		>
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					v-for="d in ICONS[step]"
					:key="d"
					:d="d"
				/>
			</svg>
		</button>
		<!-- Only the icon changes on copy, never the label: a label swapped for "Copied" was a
		     different width and shoved the whole row sideways. -->
		<button
			type="button"
			class="copy"
			:aria-label="$t(copied ? 'game.history.copied' : 'game.history.copy')"
			:title="$t('game.history.copy')"
			@click="copy"
		>
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					v-for="d in ICONS[copied ? 'copied' : 'copy']"
					:key="d"
					:d="d"
				/>
			</svg>
			PGN
		</button>
	</div>
</template>

<style scoped>
.controls {
	display: grid;
	grid-template-columns: repeat(4, 1fr) auto;
	gap: 0.25rem;
}

button {
	height: 2.25rem;
	padding: 0 0.75rem;
	color: var(--color-ink);
	background: var(--color-sunken);
	box-shadow: none;
}

button:hover:not(:disabled) {
	background: var(--color-border);
}

button:disabled {
	opacity: 0.35;
	cursor: default;
	transform: none;
}

.copy {
	margin-left: 0.5rem;
}

svg {
	width: 1.25rem;
	height: 1.25rem;
	fill: none;
	stroke: currentcolor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
}
</style>
