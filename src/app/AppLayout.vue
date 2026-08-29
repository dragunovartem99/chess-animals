<script setup lang="ts">
import LocaleSwitcher from "./LocaleSwitcher.vue";
</script>

<template>
	<header>
		<RouterLink :to="{ name: 'roster' }">{{ $t("app.title") }}</RouterLink>
		<nav>
			<RouterLink :to="{ name: 'roster' }">{{ $t("nav.roster") }}</RouterLink>
			<RouterLink :to="{ name: 'play' }">{{ $t("nav.play") }}</RouterLink>
			<RouterLink :to="{ name: 'arena' }">{{ $t("nav.arena") }}</RouterLink>
			<RouterLink :to="{ name: 'tuner' }">{{ $t("nav.tuner") }}</RouterLink>
			<RouterLink :to="{ name: 'about' }">{{ $t("nav.about") }}</RouterLink>
		</nav>
		<LocaleSwitcher />
	</header>

	<main>
		<RouterView />
	</main>
</template>
