// What a bot can have something to say about, always from its own side of the board: `take` is a
// piece it won, `lose` one it lost, `mating` a forced mate it has found, `mated` one found on it.
export const REMARKS = [
	"greet",
	"check",
	"take",
	"lose",
	"mating",
	"mated",
	"win",
	"loss",
	"draw",
] as const;

export type Remark = (typeof REMARKS)[number];
