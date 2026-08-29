import { INITIAL_FEN } from "chessops/fen";
import { parseSan } from "chessops/san";
import { makeSan } from "chessops/san";
import { describe, expect, it } from "vitest";

import { compileBot } from "@/shared/bots";
import { afterMove, positionFromFen } from "@/shared/chess";
import { chooseMove } from "@/shared/engine";
import { createRng } from "@/shared/engine/rng";
import { extractFeatures, featureId } from "@/shared/eval";

import { ROSTER_BY_ID } from "../index";

const turtle = compileBot(ROSTER_BY_ID.get("turtle")!.definition);

function reply(sanMoves: string[]): string {
	let position = positionFromFen(INITIAL_FEN);
	for (const san of sanMoves) position = afterMove({ position, move: parseSan(position, san)! });

	const move = chooseMove({
		position,
		weights: turtle.weights,
		search: turtle.search,
		temperature: turtle.temperature,
		rng: createRng("turtle"),
	})!;

	return makeSan(position, move);
}

describe("Huddle Turtle", () => {
	it("keeps its pieces near its own king rather than marching them out", () => {
		let position = positionFromFen(INITIAL_FEN);
		const opening = ["f4", "Nc6", "Nf3"];
		for (const san of opening)
			position = afterMove({ position, move: parseSan(position, san)! });

		const before = extractFeatures({ position })[featureId("huddle")];
		const move = chooseMove({
			position,
			weights: turtle.weights,
			search: turtle.search,
			temperature: turtle.temperature,
			rng: createRng("turtle"),
		})!;
		const after = extractFeatures({ position: afterMove({ position, move }) })[
			featureId("huddle")
		];

		// `huddle` is ours-minus-theirs from the side to move. Black chose the move, so a good
		// huddling move makes the number *rise* when read from White's side afterwards.
		expect(after).toBeGreaterThan(before);
	});

	it("does not answer a quiet opening by attacking", () => {
		expect(reply(["f4", "Nc6", "Nf3"])).not.toBe("Nd4");
	});
});
