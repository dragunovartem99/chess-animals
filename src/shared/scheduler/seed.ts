// A stable 32-bit FNV-1a mix of the parts, joined on "|". The tournament derives its per-game seeds
// from this, so a run reproduces exactly from its master seed.
export function mixSeed(parts: (string | number)[]): number {
	let hash = 2166136261;
	for (const character of parts.join("|")) {
		hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619) >>> 0;
	}
	return hash >>> 0;
}
