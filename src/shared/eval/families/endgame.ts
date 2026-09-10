import type { Color } from "chessops/types";
import { opposite } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { passedSpan, relativeRank } from "./masks";
import { centrality } from "./placement";

const KING_ACTIVITY = featureId("kingActivity");
const PASSED_PAWN_PUSH = featureId("passedPawnPush");
const ATTACK_ENEMY_PAWNS = featureId("attackEnemyPawns");

export const SLOTS = [KING_ACTIVITY, PASSED_PAWN_PUSH, ATTACK_ENEMY_PAWNS];

function kingCentrality({ context, color }: { context: EvalContext; color: Color }): number {
	let total = 0;
	for (const square of context.position.board.pieces(color, "king")) total += centrality(square);

	return total;
}

// A side's passed pawns, each by how far it has run — so a passer is worth more the nearer it is to
// queening, and a pawn an enemy pawn can still stop or take is worth nothing here.
function passers({ context, color }: { context: EvalContext; color: Color }): number {
	const { board } = context.position;
	const enemyPawns = board.pieces(opposite(color), "pawn");
	let total = 0;

	for (const square of board.pieces(color, "pawn")) {
		if (!passedSpan({ color, square }).intersects(enemyPawns)) {
			total += relativeRank({ color, square });
		}
	}

	return total;
}

// Enemy pawns a side attacks with anything, pawns and king included — a pawn ending is won by
// eating pawns, and the king does most of the eating.
function pawnsHit({ context, color }: { context: EvalContext; color: Color }): number {
	const enemyPawns = context.position.board.pieces(opposite(color), "pawn");

	return context.attacksBy[color].intersect(enemyPawns).size();
}

// Endgame principles. Each value is scaled by `1 - phase` here, inside the extractor, so it is
// silent while the pieces are on and full-strength with bare kings and pawns. That is per-feature
// shaping of a value, like `swarm` being negated on the way out — not a second weight vector, which
// is what METHOD.md's "One vector, not three" removed.
export function extractEndgame({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const late = 1 - context.phase;
	// The vector arrives zeroed, and a middlegame is most of what a search sees.
	if (late === 0) return;

	// `centralization` leaves the king out because in a middlegame he wants shelter; once the
	// material is off he is a fighting piece and wants the centre — hence the phase gate.
	features[KING_ACTIVITY] =
		(kingCentrality({ context, color: context.us }) -
			kingCentrality({ context, color: context.them })) *
		late;

	// A walk of every pawn, so only a bot that weighs it pays for it.
	if (context.weighs(PASSED_PAWN_PUSH)) {
		features[PASSED_PAWN_PUSH] =
			(passers({ context, color: context.us }) - passers({ context, color: context.them })) *
			late;
	}

	// Not a walk of its own, but the first read of `attacksBy` is what triggers the context's —
	// a bot on `kingActivity` alone must not pay for it.
	if (context.weighs(ATTACK_ENEMY_PAWNS)) {
		features[ATTACK_ENEMY_PAWNS] =
			(pawnsHit({ context, color: context.us }) -
				pawnsHit({ context, color: context.them })) *
			late;
	}
}
