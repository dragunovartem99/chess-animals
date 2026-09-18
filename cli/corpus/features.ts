import { extractFeatures } from "@/shared/eval";

import { sampleHead, sampleOpenings } from "./walk";

// The C extractor is checked against the TS one on `features.txt`, a feature family at a time as
// the port lands. Each line is a sample's head — see `sampleHead` — then every feature of the
// position, as the raw bits of the float32 the TS vector holds, so equal means bit-identical.
function hex(values: Float32Array): string {
	return Array.from(new Uint32Array(values.buffer), (bits) =>
		bits.toString(16).padStart(8, "0")
	).join(" ");
}

export function featureLines(): string[] {
	return sampleOpenings({ seed: "engine-features", games: 2, maxPlies: 80, sample: 4 }).map(
		(sample) => `${sampleHead(sample)};${hex(extractFeatures(sample))}`
	);
}
