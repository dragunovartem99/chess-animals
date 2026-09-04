import { INITIAL_FEN } from "chessops/fen";
import { bench } from "vitest";

import { positionFromFen } from "../../chess";
import { createExtractor, extractFeatures } from "../extract";
import { featureId } from "../features";
import { BENCHMARK_POSITIONS } from "./positions";

const positions = BENCHMARK_POSITIONS.map((fen) => positionFromFen(fen));
const opening = positionFromFen(INITIAL_FEN);

// What an animal actually weighs: one idea and enough material sense not to give the board away.
// This is the number that sets how fast the arena runs, since no bot on the roster reads more.
const animal = createExtractor({
	slots: [
		"swarm",
		"materialPawn",
		"materialKnight",
		"materialBishop",
		"materialRook",
		"materialQueen",
	].map((key) => featureId(key)),
});

bench("extractFeatures across a spread of positions", () => {
	for (const position of positions) extractFeatures({ position });
});

bench("extractFeatures on the opening position", () => {
	extractFeatures({ position: opening });
});

bench("one animal's features across a spread of positions", () => {
	for (const position of positions) animal({ position });
});
