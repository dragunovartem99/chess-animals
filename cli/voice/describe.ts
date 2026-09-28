import type { Cast } from "./casting";

// ElevenLabs' own quality words, and ours after them asking for a dry signal: `level.ts` lifts the
// quiet parts of a clip, so a reverb tail or room noise would come up along with the words.
const QUALITY =
	"Studio quality, perfect audio quality, close microphone, clean and dry: no echo, no reverb, no background noise.";

// The Voice Design prompt for an animal, in the order ElevenLabs recommends. "Native Russian"
// always: a voice designed from Russian keeps its accent in English, and the animals wear it well.
export function describe({ gender, age, persona, emotion, delivery }: Cast): string {
	const who = gender.charAt(0).toUpperCase() + gender.slice(1);
	return `Native Russian. ${who}, ${age}. ${QUALITY} Persona: ${persona}. Emotion: ${emotion}. ${delivery}`;
}
