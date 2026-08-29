<script setup lang="ts">
import LocaleSwitcher from "./LocaleSwitcher.vue";
</script>

<template>
	<header class="header">
		<div class="header-top">
			<div class="container top">
				<RouterLink
					class="brand title"
					:to="{ name: 'roster' }"
				>
					<span class="emoji logo">🐴</span>
					{{ $t("app.title") }}
				</RouterLink>
				<LocaleSwitcher />
			</div>
		</div>

		<div class="header-sub">
			<nav class="container nav">
				<RouterLink :to="{ name: 'roster' }">{{ $t("nav.roster") }}</RouterLink>
				<RouterLink :to="{ name: 'play' }">{{ $t("nav.play") }}</RouterLink>
				<RouterLink :to="{ name: 'arena' }">{{ $t("nav.arena") }}</RouterLink>
				<RouterLink :to="{ name: 'tuner' }">{{ $t("nav.tuner") }}</RouterLink>
				<RouterLink :to="{ name: 'about' }">{{ $t("nav.about") }}</RouterLink>
			</nav>
		</div>
	</header>

	<main class="container main">
		<RouterView />
	</main>
</template>

<style scoped>
.header-top {
	background: var(--color-neutral-darkest);
}

.header-sub {
	background: var(--color-neutral-dark);
}

.top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.75rem 0;
}

.brand {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	font-size: 1.35rem;
	color: var(--color-neutral-lightest);
	text-decoration: none;
}

.logo {
	font-size: 1.5rem;
	line-height: 1;
}

.nav {
	display: flex;
	flex-wrap: wrap;
	gap: 0.25rem;
	padding: 0.35rem 0;
}

.nav a {
	padding: 0.35rem 0.9rem;
	border-radius: var(--radius-full);
	color: var(--color-neutral-lighter);
	font-weight: 600;
	font-size: 0.9rem;
	text-decoration: none;
	transition:
		background 0.15s ease,
		color 0.15s ease;
}

.nav a:hover {
	color: var(--color-neutral-lightest);
}

/* Exact, not `router-link-active`: the roster sits at the locale root, which is a prefix of
   every other route, so the plain active class lights it up on every page. */
.nav a.router-link-exact-active {
	background: var(--color-accent);
	color: var(--color-black);
}

.main {
	padding: 1.5rem 0 3rem;
}
</style>
