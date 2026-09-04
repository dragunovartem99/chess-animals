<script setup lang="ts">
import type { Feature, FeatureFamily } from "@/shared/eval";

import type { SliderRange } from "../utils/ranges";
import FeatureSlider from "./FeatureSlider.vue";

defineProps<{
	family: FeatureFamily;
	features: Feature[];
	weights: Record<string, number>;
	range: SliderRange;
}>();
const emit = defineEmits<{ change: [key: string, value: number] }>();

const open = defineModel<boolean>("open", { default: false });
</script>

<template>
	<details
		class="family"
		:open="open"
		@toggle="open = ($event.target as HTMLDetailsElement).open"
	>
		<summary>{{ $t(`frankenstein.family.${family}`) }}</summary>
		<FeatureSlider
			v-for="feature in features"
			:key="feature.key"
			:feature="feature"
			:value="weights[feature.key] ?? 0"
			:range="range"
			@change="emit('change', feature.key, $event)"
		/>
	</details>
</template>

<style scoped>
.family {
	padding: 0.5rem 0;
	border-top: 1px solid var(--color-border);
}

summary {
	font-weight: 600;
	cursor: pointer;
}

.family > :not(summary) {
	margin-top: 0.5rem;
}
</style>
