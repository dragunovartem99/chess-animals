import { INITIAL_FEN } from "chessops/fen";
import { bench } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { BENCHMARK_POSITIONS } from "./positions";

const positions = BENCHMARK_POSITIONS.map((fen) => positionFromFen(fen));
const opening = positionFromFen(INITIAL_FEN);

bench("extractFeatures across a spread of positions", () => {
	for (const position of positions) extractFeatures({ position });
});

bench("extractFeatures on the opening position", () => {
	extractFeatures({ position: opening });
});
