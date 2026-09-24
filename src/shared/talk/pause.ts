import type { Rng } from "../engine";

// How long a bot waits before its move when two bots play, in milliseconds. Long enough to follow
// the game and read a remark before the next move replaces it, and uneven so the game does not
// tick like a metronome.
export const PAUSE = { min: 900, max: 2400 } as const;

export const pauseFor = (rng: Rng): number => PAUSE.min + rng.int(PAUSE.max - PAUSE.min);
