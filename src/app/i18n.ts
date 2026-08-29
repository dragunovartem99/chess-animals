import { createI18n } from "vue-i18n";

import { defaultLocale, isLocale, type Locale, messages } from "../locales";

const STORAGE_KEY = "chess-animals:locale";

// Remembered choice first, then the browser's preference, then English.
export function detectLocale(): Locale {
	const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
	if (isLocale(stored)) return stored;

	for (const language of globalThis.navigator?.languages ?? []) {
		const code = language.split("-")[0];
		if (isLocale(code)) return code;
	}

	return defaultLocale;
}

export function rememberLocale(locale: Locale): void {
	globalThis.localStorage?.setItem(STORAGE_KEY, locale);
}

export const i18n = createI18n({
	legacy: false,
	locale: defaultLocale,
	fallbackLocale: defaultLocale,
	messages,
});
