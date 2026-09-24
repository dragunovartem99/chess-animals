// A beat between sentences: asked for a whole line, the voices run "Oh. Hello. Sorry." together
// in one breath. Recording sentence by sentence and splicing them sounded pieced together, and
// padding the silences afterwards found none to pad, so the pause is asked for in the text. Only
// the spoken text gets the tag; the panel shows the line as written.
const BREAK = '<break time="0.3s" />';

// After a sentence's end, with or without an ellipsis, when another sentence follows.
export const withBreaks = (text: string): string =>
	text.replaceAll(/([.?!…]+)\s+(?=\S)/gu, `$1 ${BREAK} `);
