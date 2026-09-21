import { COLORS } from "chessops/types";
import type { Color } from "chessops/types";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { ANIMALS_BY_ID } from "@/modules/bots/roster";

// Who plays each color, kept in sync with the URL both ways. The roster page links here with
// `?black=<id>` so a card opens straight into a game against that animal. `?white=<id>` works the
// same way, and the two combine with `&` for a bot-vs-bot game. An unknown or missing id just
// leaves the default player in place for that color.
//
// A roster card (or a pasted link) sets the players and calls `onQueryChange` to start fresh, and
// choosing another animal in the picker rewrites the matching query param. Each watch checks the
// value already matches before acting, so they don't ping-pong.
export function usePlayers({
	defaults,
	onQueryChange,
}: {
	defaults: Record<Color, string>;
	onQueryChange: () => void;
}) {
	const route = useRoute();
	const router = useRouter();

	function queryPlayer(color: Color) {
		const id = route.query[color];
		return typeof id === "string" && ANIMALS_BY_ID.has(id) ? id : undefined;
	}
	const queryPlayers = computed(() => ({
		white: queryPlayer("white"),
		black: queryPlayer("black"),
	}));

	const players = ref<Record<Color, string>>({
		white: queryPlayers.value.white ?? defaults.white,
		black: queryPlayers.value.black ?? defaults.black,
	});

	watch(queryPlayers, (ids) => {
		if (!COLORS.some((c) => ids[c] && ids[c] !== players.value[c])) return;
		players.value = {
			white: ids.white ?? players.value.white,
			black: ids.black ?? players.value.black,
		};
		onQueryChange();
	});

	watch(
		() => ({ ...players.value }),
		(current) => {
			const next = Object.fromEntries(
				COLORS.map((c) => [c, ANIMALS_BY_ID.has(current[c]) ? current[c] : undefined])
			);
			if (COLORS.every((c) => next[c] === queryPlayers.value[c])) return;
			void router.replace({ query: { ...route.query, ...next } });
		}
	);

	return players;
}
