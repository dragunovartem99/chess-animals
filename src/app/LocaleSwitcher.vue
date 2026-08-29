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
	<nav :aria-label="$t('locale.label')">
		<RouterLink
			v-for="link in links"
			:key="link.locale"
			:to="link.to"
		>
			{{ $t(`locale.${link.locale}`) }}
		</RouterLink>
	</nav>
</template>
