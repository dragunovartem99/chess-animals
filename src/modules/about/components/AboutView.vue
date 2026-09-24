<script setup lang="ts">
const PAPER_URL = "http://tom7.org/chess/";
const SOURCE_URL = "https://github.com/dragunovartem99/chess-animals";

const ROSTERS = ["land", "underwater", "monsters"] as const;

// The engines the site ships as they are, each under its own licence: the licence asks that
// anyone who gets the program can find its source, so each is linked, with the licence text that
// is served beside it.
const ENGINES = [
	{
		id: "stockfish",
		source: "https://github.com/nmrugg/stockfish.js",
		license: `${import.meta.env.BASE_URL}stockfish/COPYING.txt`,
	},
	{
		id: "maia",
		source: "https://github.com/CSSLab/maia3",
		license: `${import.meta.env.BASE_URL}maia3/COPYING.txt`,
	},
] as const;
</script>

<template>
	<section class="card about">
		<h1>{{ $t("about.title") }}</h1>
		<p class="lede">{{ $t("about.lede") }}</p>

		<h2>{{ $t("about.bots.title") }}</h2>
		<p>{{ $t("about.bots.body") }}</p>
		<ul>
			<li
				v-for="roster in ROSTERS"
				:key="roster"
			>
				{{ $t(`about.bots.${roster}`) }}
			</li>
		</ul>

		<h2>{{ $t("about.points.title") }}</h2>
		<p>{{ $t("about.points.body") }}</p>

		<h2>{{ $t("about.paper.title") }}</h2>
		<p>{{ $t("about.paper.body") }}</p>

		<h2>{{ $t("about.engines.title") }}</h2>
		<ul class="engines">
			<li
				v-for="engine in ENGINES"
				:key="engine.id"
			>
				<strong>{{ $t(`about.engines.${engine.id}.name`) }}</strong>
				{{ $t(`about.engines.${engine.id}.role`) }}
				<a
					:href="engine.source"
					target="_blank"
					rel="noopener"
					>{{ $t("about.engines.source") }}</a
				>
				·
				<a
					:href="engine.license"
					target="_blank"
					rel="noopener"
					>{{ $t(`about.engines.${engine.id}.license`) }}</a
				>
			</li>
		</ul>

		<h2>{{ $t("about.credit.title") }}</h2>
		<p>{{ $t("about.credit.body") }}</p>

		<p class="links">
			<a
				:href="SOURCE_URL"
				target="_blank"
				rel="noopener"
				>{{ $t("about.links.source") }}</a
			>
			<a
				:href="PAPER_URL"
				target="_blank"
				rel="noopener"
				>{{ $t("about.links.paper") }}</a
			>
		</p>
	</section>
</template>

<style scoped>
.about {
	display: grid;
	gap: 0.5rem;
	max-width: 40rem;
}

h2 {
	margin-top: 1rem;
	font-size: 1.1rem;
}

p {
	margin: 0;
	color: var(--color-ink-muted);
}

ul {
	margin: 0;
	padding-left: 1.25rem;
	color: var(--color-ink-muted);
}

.engines {
	display: grid;
	gap: 0.35rem;
}

.engines strong {
	color: var(--color-ink);
}

.engines a {
	color: var(--color-accent-dark);
	font-weight: 600;
	white-space: nowrap;
}

.lede {
	font-size: 1.05rem;
	color: var(--color-ink);
}

.links {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	margin-top: 1rem;
}

.links a {
	color: var(--color-accent-dark);
	font-weight: 600;
}
</style>
