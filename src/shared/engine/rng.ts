export type Rng = {
	// A uniform float in [0, 1).
	float: () => number;
	// A uniform integer in [0, bound).
	int: (bound: number) => number;
	// A uniform element of a non-empty array.
	pick: <T>(items: readonly T[]) => T;
	// A copy of the four words the stream stands at, for `createRng` to carry on from.
	state: () => Uint32Array;
};

const UINT32 = 2 ** 32;

// xorshift128 is stuck at zero if seeded with zeros, so the hash is nudged off zero. Exported
// because the wasm search takes the same four words and hands them back advanced.
export function seedState(seed: number | string): Uint32Array {
	let hash = typeof seed === "number" ? seed >>> 0 : 2166136261;

	if (typeof seed === "string") {
		for (const character of seed) {
			hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619) >>> 0;
		}
	}

	const state = new Uint32Array(4);
	for (let index = 0; index < 4; index += 1) {
		hash = (hash + 0x9e3779b9) >>> 0;
		let word = hash;
		word = Math.imul(word ^ (word >>> 16), 0x21f0aaad) >>> 0;
		word = Math.imul(word ^ (word >>> 15), 0x735a2d97) >>> 0;
		state[index] = (word ^ (word >>> 15)) >>> 0;
	}

	if (state.every((word) => word === 0)) state[0] = 1;
	return state;
}

// xorshift128, seeded per game so a run replays exactly. A `Uint32Array` is a state the wasm search
// handed back; it is copied so the caller's words never move.
export function createRng(seed: number | string | Uint32Array): Rng {
	const state = seed instanceof Uint32Array ? Uint32Array.from(seed) : seedState(seed);

	function next(): number {
		const first = state[0];
		let carry = state[3];

		state[3] = state[2];
		state[2] = state[1];
		state[1] = first;

		carry ^= carry << 11;
		carry ^= carry >>> 8;
		state[0] = (carry ^ first ^ (first >>> 19)) >>> 0;

		return state[0];
	}

	const float = () => next() / UINT32;

	// Multiply-and-floor rather than rejection sampling: the bias is one part in 2^32, and the
	// bounds here are move counts, never anything near that.
	const int = (bound: number) => Math.floor(float() * bound);

	function pick<T>(items: readonly T[]): T {
		if (items.length === 0) throw new Error("cannot pick from an empty array");
		return items[int(items.length)];
	}

	return { float, int, pick, state: () => state.slice() };
}
