import type en from "./en";

/**
 * `en` is the source of truth for the string set: every other locale is typed against it, so a
 * key added in one language and forgotten in another is a type error rather than a silent
 * fallback.
 */
export type Messages = typeof en;
