<script setup lang="ts">
import { ROSTER } from "../roster";
</script>

<template>
	<section class="roster">
		<header>
			<h1>{{ $t("nav.roster") }}</h1>
			<p class="lead">{{ $t("roster.lead") }}</p>
		</header>

		<ul class="grid">
			<li
				v-for="animal in ROSTER"
				:key="animal.definition.id"
			>
				<RouterLink
					class="card animal"
					:style="{ '--tint': animal.tint }"
					:to="{ name: 'play', query: { black: animal.definition.id } }"
				>
					<span
						class="badge emoji"
						aria-hidden="true"
						>{{ animal.emoji }}</span
					>
					<span class="body">
						<span class="name">{{ $t(`bot.${animal.definition.id}.name`) }}</span>
						<span class="desc">{{
							$t(`bot.${animal.definition.id}.description`)
						}}</span>
					</span>
				</RouterLink>
			</li>
		</ul>
	</section>
</template>

<style scoped>
.roster {
	display: grid;
	gap: 1.5rem;
}

h1 {
	color: var(--color-white);
}

.lead {
	margin: 0.25rem 0 0;
	max-width: 34rem;
	color: var(--color-neutral-lightest);
	font-size: 1.05rem;
	text-wrap: balance;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
	gap: 1rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.animal {
	display: flex;
	gap: 1rem;
	align-items: center;
	height: 100%;
	padding: 1.1rem;
	border-left: 5px solid var(--tint);
	color: inherit;
	text-decoration: none;
	transition:
		transform 0.15s ease,
		box-shadow 0.15s ease;
}

.animal:hover {
	transform: translateY(-3px);
	box-shadow:
		0 6px 16px rgb(24 24 27 / 22%),
		0 0 0 2px var(--tint);
}

.badge {
	display: grid;
	place-items: center;
	flex-shrink: 0;
	width: 3.25rem;
	height: 3.25rem;
	border-radius: var(--radius-full);
	background: color-mix(in srgb, var(--tint) 16%, white);
	font-size: 1.9rem;
	line-height: 1;
}

.body {
	display: grid;
	gap: 0.3rem;
}

.name {
	font-weight: 700;
	font-size: 1.1rem;
	color: color-mix(in srgb, var(--tint) 55%, var(--color-ink));
}

.desc {
	color: var(--color-ink-muted);
	font-size: 0.92rem;
}
</style>
