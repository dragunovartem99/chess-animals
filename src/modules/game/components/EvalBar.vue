<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ score?: number; perspective: "white" | "black" }>();

// The bar shows what the bot that just moved thought of the position, in its own units. Those
// units are whatever its weights are written in, so this is a bot's opinion rather than an
// objective evaluation — which is exactly the interesting thing about a roster of animals.
const share = computed(() => {
	if (props.score === undefined) return 50;

	const white = props.perspective === "white" ? props.score : -props.score;

	// A logistic squash: the difference between +1 and +3 pawns should be visible, the difference
	// between +20 and +40 should not.
	return 100 / (1 + Math.exp(-white / 400));
});
</script>

<template>
	<div
		class="bar"
		:aria-label="$t('game.evaluation')"
	>
		<div
			class="white"
			:style="{ height: `${share}%` }"
		/>
	</div>
</template>

<style scoped>
.bar {
	position: relative;
	width: 1.25rem;
	height: 100%;
	min-height: 12rem;
	border-radius: 0.25rem;
	background: #333;
	overflow: hidden;
}

.white {
	position: absolute;
	bottom: 0;
	width: 100%;
	background: #eee;
	transition: height 200ms;
}
</style>
