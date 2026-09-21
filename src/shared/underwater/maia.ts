import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";

import type { MaiaOptions } from "../bots";
import type { Rng } from "../engine";
import { candidates, pickMove } from "./policy";
import { boardTokens } from "./tokens";

// The model behind a pipe: tokens and a rating in, 4352 move logits out. An ONNX session in the
// arena and the browser, a fake in a test — nothing here knows which.
export type MaiaSession = {
	// Settles once the model is loaded, loading it if nothing has yet.
	ready: () => Promise<void>;
	run: (input: { tokens: Float32Array; elo: number }) => Promise<Float32Array>;
};

// One move from Maia at a rating. `undefined` only when there is no legal move.
export async function maiaMove({
	session,
	position,
	options,
	rng,
}: {
	session: MaiaSession;
	position: Chess;
	options: MaiaOptions;
	rng: Rng;
}): Promise<NormalMove | undefined> {
	const logits = await session.run({ tokens: boardTokens(position), elo: options.elo });

	return pickMove({ candidates: candidates(position), logits, rng, greedy: options.greedy });
}
