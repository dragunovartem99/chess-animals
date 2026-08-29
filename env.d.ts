/// <reference types="vite/client" />

import type { Messages } from "./src/locales/types";

declare module "vue-i18n" {
	// Declaration merging into vue-i18n's own schema — the one place an `interface` is correct.
	// It makes `$t` key-checked against `locales/en`, so a missing string is a type error.
	export interface DefineLocaleMessage extends Messages {}
}
