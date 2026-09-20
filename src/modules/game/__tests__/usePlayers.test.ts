import { afterEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

import { usePlayers } from "../composables/usePlayers";

// The real router needs an app to inject into; the composable only reads `route.query` and calls
// `router.replace`, so a reactive stand-in exercises the same two-way sync.
vi.mock("vue-router", async () => {
	const { reactive } = await import("vue");
	const route = reactive({ query: {} as Record<string, string> });
	const router = { replace: vi.fn<(to: { query: object }) => void>() };

	return { useRoute: () => route, useRouter: () => router };
});

const DEFAULTS = { white: "human", black: "monkey" };

// The route is shared, so a watcher left over from one test would react to the next one's URL.
const scopes: ReturnType<typeof effectScope>[] = [];
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()));

function setup(query: Record<string, string> = {}) {
	useRoute().query = query;
	const onQueryChange = vi.fn<() => void>();
	const scope = effectScope();
	scopes.push(scope);
	const players = scope.run(() => usePlayers({ defaults: DEFAULTS, onQueryChange }))!;

	return { players, onQueryChange, route: useRoute(), replace: useRouter().replace };
}

describe("usePlayers", () => {
	it("starts from the defaults when the URL names nobody", () => {
		expect(setup().players.value).toEqual(DEFAULTS);
	});

	it("starts from an animal named in the URL, per color", () => {
		expect(setup({ black: "wolf" }).players.value).toEqual({ white: "human", black: "wolf" });
	});

	it("ignores an id that is not on the roster", () => {
		expect(setup({ white: "nobody" }).players.value).toEqual(DEFAULTS);
	});

	it("follows the URL to a new animal and asks for a fresh game", async () => {
		const { players, onQueryChange, route } = setup({ black: "wolf" });

		route.query = { black: "donkey", white: "wolf" };
		await nextTick();

		expect(players.value).toEqual({ white: "wolf", black: "donkey" });
		expect(onQueryChange).toHaveBeenCalledOnce();
	});

	it("does not restart when the URL already matches the players", async () => {
		const { onQueryChange, route } = setup({ black: "wolf" });

		route.query = { black: "wolf" };
		await nextTick();

		expect(onQueryChange).not.toHaveBeenCalled();
	});

	it("leaves a color alone when the URL no longer names it", async () => {
		const { players, route } = setup({ white: "wolf", black: "donkey" });

		route.query = { black: "monkey" };
		await nextTick();

		expect(players.value).toEqual({ white: "wolf", black: "monkey" });
	});

	it("writes the picker's choice back into the URL", async () => {
		const { players, replace, route } = setup();

		players.value.black = "donkey";
		await nextTick();

		expect(replace).toHaveBeenCalledWith({
			query: { ...route.query, white: undefined, black: "donkey" },
		});
	});

	it("does not rewrite a URL that already says the same", async () => {
		const { replace, route } = setup({ black: "wolf" });

		route.query = { black: "donkey" };
		await nextTick();

		expect(replace).not.toHaveBeenCalled();
	});
});
