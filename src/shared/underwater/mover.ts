import type { MaiaOptions } from "../bots";
import { createRng } from "../engine";
import type { GoRequest, GoResult } from "../engine";
import { maiaMove } from "./maia";
import type { MaiaSession } from "./maia";

type Move<Request> = (request: Request) => Promise<GoResult>;

// The arena's mover with Maia in front of it: a bot with `maia` asks the model, every other bot
// goes on to `next` as before. The pick is drawn from the game's own stream, so the game replays
// from its seed.
export function withMaia<Request extends GoRequest>({
	next,
	session,
}: {
	next: Move<Request>;
	// Left out for a caller that plays no underwater animal.
	session?: MaiaSession;
}): Move<Request & { maia?: MaiaOptions }> {
	return async (request) => {
		const options = request.maia;
		if (!options) return next(request);
		if (!session) throw new Error("an underwater animal needs Maia");

		const rng = createRng(request.rngState);
		const move = await maiaMove({ session, position: request.game.position, options, rng });

		return { move, score: 0, rngState: rng.state() };
	};
}
