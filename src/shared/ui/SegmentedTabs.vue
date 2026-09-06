<script setup lang="ts" generic="T extends string">
// The panel on `/play` and `/frankenstein` is one thing showing one of two views of the same
// game; this is the control that switches between them. `i18nPrefix` keys the labels, so
// `:tabs="['moves', 'breakdown']"` with prefix `game.tab` renders `$t('game.tab.moves')`.
defineProps<{ tabs: readonly T[]; i18nPrefix: string }>();
const active = defineModel<T>({ required: true });
</script>

<template>
	<div
		class="tabs"
		role="tablist"
	>
		<button
			v-for="name in tabs"
			:key="name"
			type="button"
			role="tab"
			:aria-selected="active === name"
			:class="{ active: active === name }"
			@click="active = name"
		>
			{{ $t(`${i18nPrefix}.${name}`) }}
		</button>
	</div>
</template>

<style scoped>
.tabs {
	display: flex;
	gap: 0.25rem;
	padding: 0.25rem;
	border-radius: var(--radius-full);
	background: var(--color-sunken);
}

.tabs button {
	flex: 1;
	padding: 0.35rem 0.75rem;
	border-radius: var(--radius-full);
	background: none;
	color: var(--color-neutral-darker);
	font-size: 0.9rem;
	box-shadow: none;
}

.tabs button:hover {
	background: var(--color-stripe);
}

/* On a white card an amber chip would shout; the selected tab is simply lifted out of the
   track, which is all the signal two tabs need. */
.tabs button.active {
	background: var(--color-surface);
	color: var(--color-ink);
	box-shadow: 0 1px 2px rgb(24 24 27 / 20%);
}
</style>
