<template>
	<section class="card placeholder">
		<h1>{{ $t("nav.tuner") }}</h1>
		<p>{{ $t("placeholder.notBuiltYet") }}</p>
	</section>
</template>

<style scoped>
.placeholder {
	display: grid;
	gap: 0.5rem;
	max-width: 40rem;
}

p {
	margin: 0;
	color: var(--color-ink-muted);
}
</style>
