<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import { locales } from "../locales";

const route = useRoute();

// Same page, other language: swap the locale segment and keep everything after it.
const links = computed(() =>
	locales.map((locale) => ({
		locale,
		to: { ...route, params: { ...route.params, locale } },
	}))
);
</script>

<template>
	<nav
		class="switch"
		:aria-label="$t('locale.label')"
	>
		<RouterLink
			v-for="link in links"
			:key="link.locale"
			:to="link.to"
		>
			{{ $t(`locale.${link.locale}`) }}
		</RouterLink>
	</nav>
</template>

<style scoped>
.switch {
	display: inline-flex;
	gap: 0.25rem;
	padding: 0.25rem;
	border-radius: var(--radius-full);
	background: var(--color-neutral-dark);
}

a {
	padding: 0.25rem 0.9rem;
	border-radius: var(--radius-full);
	color: var(--color-neutral-lighter);
	font-size: 0.8rem;
	font-weight: 700;
	text-decoration: none;
	transition:
		background 0.15s ease,
		color 0.15s ease;
}

a:hover {
	color: var(--color-neutral-lightest);
}

a.router-link-exact-active {
	background: var(--color-accent-veil);
	color: var(--color-accent-light);
}
</style>
