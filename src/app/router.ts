import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import { isLocale, locales } from "../locales";
import { detectLocale, i18n, rememberLocale } from "./i18n";

const routes: RouteRecordRaw[] = [
	{
		path: `/:locale(${locales.join("|")})`,
		component: () => import("./AppLayout.vue"),
		// Routes reach a module only through its barrel, never into `components/` — so each
		// module is also its own lazy chunk.
		children: [
			{
				path: "",
				name: "roster",
				component: () => import("../modules/bots").then((m) => m.RosterView),
			},
			{
				path: "bots/:id",
				name: "bot",
				component: () => import("../modules/bots").then((m) => m.BotView),
			},
			{
				path: "play",
				name: "play",
				component: () => import("../modules/game").then((m) => m.PlayView),
			},
			{
				path: "arena",
				name: "arena",
				component: () => import("../modules/arena").then((m) => m.ArenaView),
			},
			{
				path: "tuner",
				name: "tuner",
				component: () => import("../modules/tuner").then((m) => m.TunerView),
			},
			{
				path: "about",
				name: "about",
				component: () => import("../modules/about").then((m) => m.AboutView),
			},
		],
	},
	// Anything without a known locale prefix — `/`, `/play`, a stale link — is re-entered under
	// the reader's own locale rather than 404ing, so every url carries a locale. A path that
	// still matches nothing once prefixed falls back to that locale's root, which is what keeps
	// a typo like `/xx/play` from redirecting onto itself forever.
	{
		path: "/:pathMatch(.*)*",
		redirect: (to) => {
			const locale = detectLocale();
			const prefixed = `/${locale}${to.path}`;
			return router.resolve(prefixed).matched.length > 1 ? prefixed : `/${locale}`;
		},
	},
];

export const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
	const { locale } = to.params;
	if (!isLocale(locale)) return;

	i18n.global.locale.value = locale;
	rememberLocale(locale);
});
