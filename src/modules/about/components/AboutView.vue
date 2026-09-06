<script setup lang="ts">
const PAPER_URL = "http://tom7.org/chess/";
const SOURCE_URL = "https://github.com/dragunovartem99/chess-animals";

const BOTS = ["wolf", "monkey", "donkey"] as const;
</script>

<template>
	<section class="card about">
		<h1>{{ $t("about.title") }}</h1>
		<p class="lede">{{ $t("about.lede") }}</p>

		<h2>{{ $t("about.bots.title") }}</h2>
		<p>{{ $t("about.bots.body") }}</p>
		<p>{{ $t("about.bots.listLead") }}</p>
		<ul>
			<li
				v-for="bot in BOTS"
				:key="bot"
			>
				{{ $t(`about.bots.${bot}`) }}
			</li>
		</ul>

		<h2>{{ $t("about.paper.title") }}</h2>
		<p>{{ $t("about.paper.body") }}</p>

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
