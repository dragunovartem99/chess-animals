// Which ElevenLabs voice speaks for each land animal, in both languages: the model keeps a
// voice's timbre across them, so an animal sounds like itself in Russian too. Most are
// made with Voice Design from the description beside it and live in the project's account, so
// regenerating a clip needs that account's key — the clips are committed for that reason. The
// later ones are designed from a Russian sample: one designed from English rolled its Russian «р»
// like an English speaker. A few are stock voices, which take none of the account's 30 custom
// slots: two rosters of 16 designed voices would need 32.
export const CASTING: Record<string, string> = {
	// Dopey and cheerful, a slow country drawl, forgets what it came for.
	donkey: "c5XTzZfSskN4Ut6RVcrx",
	// Shy, a breathy near-whisper, sorry for everything. Sounds like a girl, so she speaks as one in
	// Russian.
	dove: "tXtmoClvKMDIT6yAj5Ew",
	// Hyperactive and squeaky, too excited to breathe.
	lemming: "o7PlX1q9E070RX4u2lu6",
	// A pompous old aristocrat, sure it has never lost.
	dodo: "X9FG2ZBSMn17O2KBZSxg",
	// A hoarse middle-aged brawler, low and heavy, barks in short bursts.
	goat: "xMg7WUw8SQNRZmHbkAKr",
	// An old, shrill, nasal chatterbox, sing-song, repeats itself.
	parrot: "b6DpG4oSJGpAaWu4RKjb",
	// Barely awake, yawning, drifts off mid-word.
	sloth: "f6Cz3JynC8oTg7XbYVw7",
	// In his late eighties, gravelly and a little shaky, a pedantic old professor.
	elephant: "GNq6yBiEuCpwk2fhvSpG",
	// Deadpan and weary, unimpressed by anything. Stock: Chris.
	camel: "iP95p4xoKVk53GoZ742B",
	// A fast-talking braggart, jittery and impatient.
	hare: "6m9fXYIlcPNYN4tGOfeR",
	// A grumpy-warm grandpa, deep and rumbling.
	bear: "QoNaah2cnyD6PDsMnsqs",
	// An unstable tyrant king, a deep regal bass: a sweet whisper, then a roar without warning.
	lion: "116XzEWN3rUDUV1F5pOs",
	// Calm menace, smooth and quiet, never raises its voice. Stock: Eric.
	tiger: "cjVigY5qzO86Huf0OWal",
	// A nineties gopnik, raspy, cocky and clipped.
	wolf: "0QjRjbzPMSepAhrWoVSm",
	// Sly and flirtatious; the Fox is a she in Russian.
	fox: "IgJyigVhCEiWtDubWOqy",
	// Creepy and over-polite, a soft, slightly creaky hissing whisper.
	spider: "bW6RZDNm4HBOdIINQLSi",
};
