import type { Chess } from "chessops/chess";

import { gameStatus } from "../chess";
import type { createAdjudicator } from "./adjudicate";
import { materialEdge } from "./adjudicate";
import type { GameReport, GameSpec } from "./types";

// Why a game ends before either bot moves again, or `undefined` while it goes on.
export function gameEnd({
	spec,
	position,
	keys,
	ply,
	adjudicator,
}: {
	spec: GameSpec;
	position: Chess;
	keys: readonly string[];
	ply: number;
	adjudicator: ReturnType<typeof createAdjudicator>;
}): GameReport | undefined {
	const status = gameStatus({ position, keys, plyLimit: spec.plyLimit, ply });
	if (status.over) return { result: status.result, reason: status.reason, plies: ply };

	const edge = materialEdge(position);
	const resigned = adjudicator.verdict(edge);
	if (resigned) return { result: resigned, reason: "resigned", plies: ply };

	// Level material and 24 half-moves with no capture or pawn move: a position both bots have
	// shuffled this long is a draw at the ply cap too. Guarded on level material so a slow but
	// real win is never thrown away — only the aimless walk to ply 120 is skipped.
	if (position.halfmoves >= 24 && Math.abs(edge) < 2) {
		return { result: null, reason: "no-progress", plies: ply };
	}

	return undefined;
}
