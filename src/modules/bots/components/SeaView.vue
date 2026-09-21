<script setup lang="ts">
import { useTheme } from "@/shared/ui";

import { SEA } from "../roster";
import AnimalGrid from "./AnimalGrid.vue";

useTheme("sea");
</script>

<template>
	<section class="roster">
		<header>
			<h1>{{ $t("nav.underwater") }}</h1>
			<p class="lead">{{ $t("underwater.lead") }}</p>
		</header>

		<AnimalGrid :animals="SEA" />
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
