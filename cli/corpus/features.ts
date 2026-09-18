import type { Chess } from "chessops/chess";
import { makeUci } from "chessops/util";

import { afterMove, fenFromPosition, legalMoves, positionFromFen } from "@/shared/chess";
import { createRng } from "@/shared/engine";
import { extractFeatures, type PlayedMove } from "@/shared/eval";
import { openings } from "@/shared/openings";

// The C extractor is checked against the TS one on `features.txt`, a feature family at a time as
// the port lands. Each line is the position a move was played from, the move — `-` for a root
// position, which has none and reads the move family as zero — and every feature of the position
// after it, as the raw bits of the float32 the TS vector holds, so equal means bit-identical.
//
// Random play from the curated openings rather than from the start: the openings put developed,
// castled, realistic positions in, and the random moves after them pull in the trades, the
// endgames and the hanging men that the rest of the families read.
const GAMES_PER_OPENING = 2;
const MAX_PLIES = 80;
// One ply in SAMPLE is kept, so a game contributes a spread of phases rather than every ply.
const SAMPLE = 4;

function hex(values: Float32Array): string {
	return Array.from(new Uint32Array(values.buffer), (bits) =>
		bits.toString(16).padStart(8, "0")
	).join(" ");
}

function line({ position, played }: { position: Chess; played?: PlayedMove }): string {
	const parent = played ? fenFromPosition(played.parent) : fenFromPosition(position);
	const uci = played ? makeUci(played.move) : "-";

	return `${parent};${uci};${hex(extractFeatures({ position, played }))}`;
}

export function featureLines(): string[] {
	const rng = createRng("engine-features");
	const lines: string[] = [];

	for (const opening of openings) {
		lines.push(line({ position: positionFromFen(opening.fen) }));

		for (let game = 0; game < GAMES_PER_OPENING; game += 1) {
			let position = positionFromFen(opening.fen);

			for (let ply = 0; ply < MAX_PLIES && !position.isEnd(); ply += 1) {
				const move = rng.pick(legalMoves(position));
				const next = afterMove({ position, move });

				if (rng.int(SAMPLE) === 0)
					lines.push(line({ position: next, played: { parent: position, move } }));
				position = next;
			}
		}
	}

	return lines;
}
