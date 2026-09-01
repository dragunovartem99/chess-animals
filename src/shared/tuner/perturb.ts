import type { Rng } from "../engine";

// A Rademacher vector: each entry ±1 with equal probability. SPSA perturbs every parameter at
// once along one of these, which is what lets it estimate a gradient from two measurements no
// matter how many parameters there are.
export function rademacher({ size, rng }: { size: number; rng: Rng }): number[] {
	return Array.from({ length: size }, () => (rng.int(2) === 0 ? -1 : 1));
}
