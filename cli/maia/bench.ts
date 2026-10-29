import { readFile } from "node:fs/promises";

import type { Chess } from "chessops/chess";

import { afterMove, legalMoves, positionFromFen } from "@/shared/chess";
import { createRng } from "@/shared/engine";
import { openings } from "@/shared/openings";
import { createMaiaSession } from "@/shared/underwater";
import { nodeRuntime } from "@/shared/underwater/model";
import { candidates } from "@/shared/underwater/policy";
import { boardTokens } from "@/shared/underwater/tokens";

// `tsx cli/maia/bench.ts <reference.onnx> [node:]<candidate.onnx>...` — ms per move, and how far
// each candidate's move distribution sits from the reference over positions a few random plies
// past the openings. `node:` runs a candidate on onnxruntime-node instead of the web runtime.
const PLIES = 6;
const ELO = 1500;

const rng = createRng(7);
const positions = openings.flatMap((opening) => {
	let position = positionFromFen(opening.fen);
	const walk = [position];
	for (let ply = 0; ply < PLIES; ply += 1) {
		const moves = legalMoves(position);
		if (moves.length === 0) break;
		position = afterMove({ position, move: moves[Math.floor(rng.float() * moves.length)]! });
		walk.push(position);
	}
	return walk;
});

function softmax({ logits, position }: { logits: Float32Array; position: Chess }): number[] {
	const scores = candidates(position).map(({ index }) => logits[index] ?? -Infinity);
	const best = Math.max(...scores);
	const weights = scores.map((score) => Math.exp(score - best));
	const sum = weights.reduce((acc, weight) => acc + weight, 0);
	return weights.map((weight) => weight / sum);
}

async function measure(file: string) {
	const native = file.startsWith("node:");
	const session = createMaiaSession({
		load: () => readFile(native ? file.slice(5) : file),
		...(native ? { runtime: nodeRuntime } : {}),
	});
	await session.ready();
	const started = performance.now();
	// One move at a time, as a game asks: a batch would hide the per-move cost.
	const dists = await positions.reduce(
		async (done, position) => {
			const logits = await session.run({ tokens: boardTokens(position), elo: ELO });
			return [...(await done), softmax({ logits, position })];
		},
		Promise.resolve([] as number[][])
	);
	return { ms: (performance.now() - started) / positions.length, dists };
}

const argmax = (dist: number[]) => dist.indexOf(Math.max(...dist));
// Total variation: the share of probability mass the candidate moves to other moves.
const distance = (a: number[], b: number[]) =>
	a.reduce((acc, p, i) => acc + Math.abs(p - (b[i] ?? 0)), 0) / 2;

const [reference, ...files] = process.argv.slice(2);
if (!reference) throw new Error("usage: bench.ts <reference.onnx> [node:]<candidate.onnx>...");
const base = await measure(reference);
console.log(`${positions.length} positions\n${reference}: ${base.ms.toFixed(1)} ms/move`);
async function report(file: string) {
	const got = await measure(file);
	const same = got.dists.filter((dist, i) => argmax(dist) === argmax(base.dists[i]!)).length;
	const drift = got.dists.reduce((acc, dist, i) => acc + distance(dist, base.dists[i]!), 0);
	const n = positions.length;
	console.log(
		`${file}: ${got.ms.toFixed(1)} ms/move  same top move ${((100 * same) / n).toFixed(1)}%  mean TV ${((100 * drift) / n).toFixed(2)}%`
	);
}

// Candidates one after another: two sessions at once would share the core and time each other.
await files.reduce((done, file) => done.then(() => report(file)), Promise.resolve());
