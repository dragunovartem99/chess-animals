import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { afterMove, legalMoves, positionFromFen } from "../../chess";
import { createExtractor, type Extractor, type ExtractFrame } from "../extract";
import { extractFeatures } from "../extract";
import { SLOTS as AGGRESSION } from "../families/aggression";
import { SLOTS as CONTROL } from "../families/control";
import { SLOTS as KING } from "../families/king";
import { SLOTS as MATERIAL } from "../families/material";
import { SLOTS as MOBILITY } from "../families/mobility";
import { SLOTS as MOVE } from "../families/move";
import { SLOTS as PAWNS } from "../families/pawns";
import { SLOTS as PIECES } from "../families/pieces";
import { SLOTS as PLACEMENT } from "../families/placement";
import { SLOTS as PROXIMITY } from "../families/proximity";
import { SLOTS as SYMMETRY } from "../families/symmetry";
import { FEATURES, featureId } from "../features";

// A spread wide enough that every feature has somewhere to fire: a middlegame, a broken pawn
// structure, an exposed king, a promotion, a mate in one, and a position where castling is legal.
const CORPUS = [
	INITIAL_FEN,
	"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
	"4k3/8/8/4p3/1P1p4/8/2P5/4K3 w - - 0 1",
	"6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
	"7k/3P4/8/8/8/8/8/4K3 w - - 0 1",
	"6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
	"4k3/8/8/3N4/2P5/8/8/4K3 w - - 0 1",
	"8/8/3k4/8/3K4/8/8/8 w - - 0 1",
	"r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
	"4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1",
	"4k3/8/8/8/P7/P7/8/4K3 w - - 0 1",
];

// The two game-enders are preferences, not extracted features: nothing ever writes them into a
// vector, because `terminalTerm` scores a finished game instead of the extractor describing one.
// `terminal.test.ts` is what holds them to firing.
const NOT_EXTRACTED = new Set(["givesMate", "givesStalemate"]);

// Every family's declared slots, by the name the extractor knows it under. `tempo` is its own
// one-line family, written by the extractor itself rather than by a `families/` module.
const DECLARED = {
	material: MATERIAL,
	placement: PLACEMENT,
	pieces: PIECES,
	pawns: PAWNS,
	king: KING,
	mobility: MOBILITY,
	control: CONTROL,
	proximity: PROXIMITY,
	symmetry: SYMMETRY,
	aggression: AGGRESSION,
	move: MOVE,
	tempo: [featureId("tempo")],
};

// Every frame in the corpus: each position, and each position a legal move from it produces.
function everyFrame(): ExtractFrame[] {
	const frames: ExtractFrame[] = [];

	for (const fen of CORPUS) {
		const position = positionFromFen(fen);
		frames.push({ position });

		for (const move of legalMoves(position)) {
			frames.push({
				position: afterMove({ position, move }),
				played: { parent: position, move },
			});
		}
	}

	return frames;
}

function everyVectorFrom(extract: Extractor): number[][] {
	return everyFrame().map((frame) => Array.from(extract(frame)));
}

function everyVectorInCorpus(): number[][] {
	return everyVectorFrom(extractFeatures);
}

describe("the feature registry", () => {
	// Guards against the failure this test was written for: a family quietly dropped from the
	// extractor still leaves its features in the registry, and every position then reads zero for
	// them — a bot silently loses a whole part of its personality with nothing to show for it.
	it("has no feature that never fires anywhere in the corpus", () => {
		const vectors = everyVectorInCorpus();
		const dead = FEATURES.filter(
			(feature) =>
				!NOT_EXTRACTED.has(feature.key) &&
				vectors.every((vector) => vector[feature.id] === 0)
		);

		expect(dead.map((feature) => feature.key)).toEqual([]);
	});

	// `createExtractor` skips a family whose slots a bot leaves at zero, which is only sound if
	// the slots a family declares are exactly the ones it writes. A feature added to an extractor
	// but not to its `SLOTS` would read zero for every bot that weighs it and nothing else — the
	// quietest possible bug, and this is what makes it loud.
	it("has every family writing exactly the slots it declares", () => {
		for (const [family, slots] of Object.entries(DECLARED)) {
			const declared = new Set(slots);
			const written = new Set<number>();

			for (const vector of everyVectorFrom(createExtractor({ slots }))) {
				vector.forEach((value, id) => {
					if (value !== 0) written.add(id);
				});
			}

			const stray = [...written].filter((id) => !declared.has(id));

			expect({ family, stray: stray.map((id) => FEATURES[id].key) }).toEqual({
				family,
				stray: [],
			});
		}
	});

	// The two extractors are written out separately — one straight-line for the everything case,
	// one table-driven for the sparse case — because the indirection the table costs is worth
	// paying only when it saves whole families. That is a duplication, so it is pinned.
	it("reads the same vector whichever extractor asks for every feature", () => {
		const everything = createExtractor({ slots: FEATURES.map((feature) => feature.id) });
		const sparse = everyVectorFrom(everything);
		const full = everyVectorInCorpus();

		expect(sparse).toEqual(full);
	});
});
