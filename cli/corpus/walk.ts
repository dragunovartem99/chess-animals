import type { Chess } from "chessops/chess";
import { makeUci } from "chessops/util";

import { afterMove, fenFromPosition, legalMoves, positionFromFen } from "@/shared/chess";
import { createRng } from "@/shared/engine";
import type { PlayedMove } from "@/shared/eval";
import { openings } from "@/shared/openings";

export type Sample = { position: Chess; played?: PlayedMove };

// Random play from the curated openings rather than from the start: the openings put developed,
// castled, realistic positions in, and the random moves after them pull in the trades, the
// endgames and the hanging men the evaluation reads. Each opening's root is kept, then one ply in
// `sample` of every game — a spread of phases rather than every ply — and, with `mates`, every
// mate the random mover stumbles into, which sampling alone would almost never keep.
export function sampleOpenings({
	seed,
	games,
	maxPlies,
	sample,
	mates = false,
}: {
	seed: string;
	games: number;
	maxPlies: number;
	sample: number;
	mates?: boolean;
}): Sample[] {
	const rng = createRng(seed);
	const samples: Sample[] = [];

	for (const opening of openings) {
		samples.push({ position: positionFromFen(opening.fen) });

		for (let game = 0; game < games; game += 1) {
			let position = positionFromFen(opening.fen);

			for (let ply = 0; ply < maxPlies && !position.isEnd(); ply += 1) {
				const move = rng.pick(legalMoves(position));
				const next = afterMove({ position, move });

				// The draw comes first so the stream is the same with `mates` on or off.
				if (rng.int(sample) === 0 || (mates && next.isCheckmate()))
					samples.push({ position: next, played: { parent: position, move } });
				position = next;
			}
		}
	}

	return samples;
}

// A sample as the C fixtures spell it: the position the move was played from, then the move —
// `-` for a root, which has none and reads the move family as zero.
export function sampleHead({ position, played }: Sample): string {
	return played
		? `${fenFromPosition(played.parent)};${makeUci(played.move)}`
		: `${fenFromPosition(position)};-`;
}
