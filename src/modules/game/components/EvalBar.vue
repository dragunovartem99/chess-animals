<script setup lang="ts">
import { computed } from "vue";

// `score` is White-relative, the way an engine reports one: positive means White stands better.
// It is still a *bot's* opinion, in whatever units that bot's weights are written in — which is
// the interesting thing about a roster of animals, not a defect.
const props = defineProps<{ score?: number }>();

const share = computed(() => {
	if (props.score === undefined) return 50;

	// A logistic squash: the difference between +1 and +3 pawns should be visible, the difference
	// between +20 and +40 should not.
	return 100 / (1 + Math.exp(-props.score / 400));
});
</script>

<template>
	<div
		class="eval-bar"
		:aria-label="$t('game.evaluation')"
	>
		<div
			class="white"
			:style="{ height: `${share}%` }"
		/>
	</div>
</template>

<style scoped>
.eval-bar {
	position: relative;
	width: 1.25rem;
	/* No height of its own: as a flex item it stretches to whatever the board next to it is. */
	min-height: 12rem;
	border: 1px solid var(--color-neutral-darkest);
	border-radius: var(--radius-sm);
	background: var(--color-neutral-darkest);
	overflow: hidden;
}

.white {
	position: absolute;
	bottom: 0;
	width: 100%;
	background: var(--color-white);
	transition: height 200ms;
}
</style>
