import { COLORS } from "chessops/types";
import type { Color } from "chessops/types";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { ANIMALS_BY_ID } from "@/modules/bots/roster";

// Players synced with `?white=` / `?black=` both ways; the human seat is written as `human` too, or
// a reload puts an animal in it. Each watch checks for a match first, so they don't ping-pong.
export function usePlayers({
	defaults,
	human,
	onQueryChange,
}: {
	defaults: Record<Color, string>;
	human: string;
	onQueryChange: () => void;
}) {
	const route = useRoute();
	const router = useRouter();

	function queryPlayer(color: Color) {
		const id = route.query[color];
		return typeof id === "string" && (id === human || ANIMALS_BY_ID.has(id)) ? id : undefined;
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
			if (COLORS.every((c) => current[c] === queryPlayers.value[c])) return;
			void router.replace({ query: { ...route.query, ...current } });
		}
	);

	return players;
}
