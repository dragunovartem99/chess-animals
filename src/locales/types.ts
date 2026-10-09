import type en from "./en";

// `en` is the source of truth: a key missing from another locale is a type error, not a silent
// fallback.
export type Messages = typeof en;
