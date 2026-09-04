<script setup lang="ts">
import type { Feature } from "@/shared/eval";

import type { SliderRange } from "../utils/ranges";

const props = defineProps<{ feature: Feature; value: number; range: SliderRange }>();
const emit = defineEmits<{ change: [number] }>();

// The slider clamps to the family band; the number input is the value of record, so an outlier
// like the Wolf's `givesMate: 100000` can still be entered exactly even though no slider could
// usefully span that range.
const clamped = (raw: number) => Math.min(Math.max(raw, props.range.min), props.range.max);
</script>

<template>
	<div class="row">
		<label :for="`w-${feature.key}`">{{ $t(feature.i18nKey) }}</label>
		<input
			type="range"
			:min="range.min"
			:max="range.max"
			:step="range.step"
			:value="clamped(value)"
			@input="emit('change', Number(($event.target as HTMLInputElement).value))"
		/>
		<input
			:id="`w-${feature.key}`"
			class="number"
			type="number"
			:value="value"
			@change="emit('change', Number(($event.target as HTMLInputElement).value))"
		/>
	</div>
</template>

<style scoped>
.row {
	display: grid;
	grid-template-columns: 1fr 8rem 4.5rem;
	gap: 0.5rem;
	align-items: center;
	font-size: 0.85rem;
}

label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

input[type="range"] {
	accent-color: var(--color-accent);
}

.number {
	width: 100%;
	padding: 0.2em 0.4em;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-sm);
	font: inherit;
	text-align: right;
}
</style>
