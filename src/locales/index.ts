import en from "./en";
import ru from "./ru";

export const messages = { en, ru };

export const locales = ["en", "ru"] as const;

export const defaultLocale = "en" satisfies Locale;

export type Locale = keyof typeof messages;

export function isLocale(value: unknown): value is Locale {
	return typeof value === "string" && value in messages;
}

export type { Messages } from "./types";
