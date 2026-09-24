// What a bot can have something to say about, always from its own side of the board: `gloat` is
// the other side's blunder, `groan` its own, `mating` a forced mate it has and `mated` one it is in.
export const REMARKS = [
	"greet",
	"gloat",
	"groan",
	"mating",
	"mated",
	"win",
	"loss",
	"draw",
] as const;

export type Remark = (typeof REMARKS)[number];
