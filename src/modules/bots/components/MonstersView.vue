<script setup lang="ts">
import { useTheme } from "@/shared/ui";

import { MONSTERS } from "../roster";
import AnimalGrid from "./AnimalGrid.vue";

useTheme("sea");
</script>

<template>
	<section class="roster">
		<header>
			<h1>{{ $t("nav.monsters") }}</h1>
			<p class="lead">{{ $t("monsters.lead") }}</p>
		</header>

		<AnimalGrid :animals="MONSTERS" />
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
	color: var(--color-neutral-lightest);
	font-size: 1.05rem;
}
</style>
