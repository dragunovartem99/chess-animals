<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

import { theme } from "@/shared/ui";
import type { Theme } from "@/shared/ui";

import LocaleSwitcher from "./LocaleSwitcher.vue";

const LOGOS: Record<Theme, string> = { sea: "🫧", monsters: "🌚" };

// Set on the document, not on this layout: the page's background is the body's, and the variables
// that repaint the board and the cards are read from the root.
watch(
	theme,
	(next) => {
		if (next) document.documentElement.dataset.theme = next;
		else delete document.documentElement.dataset.theme;
	},
	{ immediate: true }
);

onBeforeUnmount(() => {
	delete document.documentElement.dataset.theme;
});
</script>

<template>
	<header class="header">
		<div class="header-top">
			<div class="container top">
				<RouterLink
					class="brand title"
					:to="{ name: 'roster' }"
				>
					<span class="emoji logo">{{ theme ? LOGOS[theme] : "🌞" }}</span>
					{{ $t("app.title") }}
				</RouterLink>
				<LocaleSwitcher />
			</div>
		</div>

		<div class="header-sub">
			<nav class="container nav">
				<RouterLink :to="{ name: 'roster' }">{{ $t("nav.roster") }}</RouterLink>
				<RouterLink :to="{ name: 'monsters' }">{{ $t("nav.monsters") }}</RouterLink>
				<RouterLink :to="{ name: 'play' }">{{ $t("nav.play") }}</RouterLink>
				<RouterLink :to="{ name: 'about' }">{{ $t("nav.about") }}</RouterLink>
				<RouterLink :to="{ name: 'frankenstein' }">{{ $t("nav.frankenstein") }}</RouterLink>
			</nav>
		</div>
	</header>

	<main class="container main">
		<RouterView />
	</main>
</template>

<style scoped>
.header-top {
	background: var(--color-wood);
}

.header-sub {
	background: var(--color-wood-light);
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
	gap: 0.45rem;
	font-size: 1.35rem;
	color: var(--color-wood-text);
	text-decoration: none;
}

.logo {
	font-size: 1.5rem;
	line-height: 1;
}

.nav {
	display: flex;
	gap: 0.25rem;
	padding: 0.35rem 0;
	overflow-x: auto;
	/* One scrolling row instead of wrapping: on a phone the fourth item dropped to
	   its own line and doubled the bar's height. */
	scrollbar-width: none;
}

.nav::-webkit-scrollbar {
	display: none;
}

.nav a {
	flex: none;
	padding: 0.35rem 0.9rem;
	border-radius: var(--radius-full);
	color: rgb(244 234 217 / 72%);
	font-weight: 600;
	font-size: 0.9rem;
	text-decoration: none;
	transition:
		background 0.15s ease,
		color 0.15s ease;
}

.nav a:hover {
	color: var(--color-wood-text);
}

/* Exact, not `router-link-active`: the roster sits at the locale root, which is a prefix of
   every other route, so the plain active class lights it up on every page. */
.nav a.router-link-exact-active {
	background: var(--color-accent-veil);
	color: var(--color-accent-light);
}

.main {
	padding: 1.5rem 0 3rem;
}

/* On a phone the brand wraps to two lines; shrink it and tighten the bars so the
   header does not eat a third of the viewport before any content shows. */
@media (max-width: 32rem) {
	.top {
		padding: 0.5rem 0;
	}

	.brand {
		font-size: 1.05rem;
		line-height: 1.15;
		gap: 0.35rem;
	}

	.logo {
		font-size: 1.2rem;
	}

	.nav a {
		padding: 0.3rem 0.7rem;
		font-size: 0.85rem;
	}
}
</style>
