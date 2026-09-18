import { ROSTER } from "@/modules/bots/roster";
import { compileBot } from "@/shared/bots";
import { evaluatePosition } from "@/shared/engine";

import { sampleHead, sampleOpenings } from "./walk";

// The C evaluation is checked against `evaluatePosition` on `evals.txt`, for every animal on the
// roster. The file opens with one `bot` line per animal — its id, whether it searches with
// quiescence, and its compiled weights as float32 bits — then one line per sample: its head, and each animal's score in roster order as
// the bits of the float64 the TS search compares, so equal means bit-identical. Mates are kept
// whenever the random mover finds one, so the terminal score is read and not only the dot.
const bits32 = (values: Float32Array) =>
	Array.from(new Uint32Array(values.buffer), (bits) => bits.toString(16).padStart(8, "0")).join(
		" "
	);

const bits64 = (values: Float64Array) =>
	Array.from(new BigUint64Array(values.buffer), (bits) =>
		bits.toString(16).padStart(16, "0")
	).join(" ");

export function evalLines(): string[] {
	const bots = ROSTER.map((animal) => compileBot(animal.definition));
	const samples = sampleOpenings({
		seed: "engine-evals",
		games: 6,
		maxPlies: 300,
		sample: 100,
		mates: true,
	});

	return [
		...bots.map(
			(bot) => `bot;${bot.id};${bot.search.quiescence ? 1 : 0};${bits32(bot.weights)}`
		),
		...samples.map((sample) => {
			const scores = Float64Array.from(bots, ({ weights }) =>
				evaluatePosition({ ...sample, weights })
			);
			return `${sampleHead(sample)};${bits64(scores)}`;
		}),
	];
}
