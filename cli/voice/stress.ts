import type { Locale } from "@/locales";

// Stress the voices get wrong, fixed in the spoken text only: the panel shows the line as
// written. The multilingual model mostly honours a combining acute after the stressed vowel, and
// a capital marks that vowel here because the acute is invisible in most editors. Keyed by every
// locale, so a new one is a type error until it says it needs no fixes.
const STRESS: Record<Locale, string[]> = {
	en: [],
	ru: ["пятьдесЯт", "заходИ"],
};

const ACUTE = "́";

// Lower-cased word → the word with the acute after its stressed vowel.
export const stressMap = (words: string[]): Map<string, string> =>
	new Map(
		words.map((word) => [
			word.toLowerCase(),
			word.replace(/\p{Lu}/u, (vowel) => vowel.toLowerCase() + ACUTE),
		])
	);

export const STRESSED = Object.fromEntries(
	Object.entries(STRESS).map(([locale, words]) => [locale, stressMap(words)])
) as Record<Locale, Map<string, string>>;

// Matches whole words in any case, and keeps a capital at the start of a sentence.
export function stressed({ text, stress }: { text: string; stress: Map<string, string> }): string {
	return text.replaceAll(/\p{L}+/gu, (word) => {
		const fixed = stress.get(word.toLowerCase());
		if (!fixed) return word;
		return word[0] === word[0].toUpperCase() ? fixed[0].toUpperCase() + fixed.slice(1) : fixed;
	});
}
