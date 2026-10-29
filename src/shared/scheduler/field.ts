import type { TournamentBot } from "./tournament";

// `sparse` dealt evenly among `dense`, order kept within each: with the Maia animals every third
// seat or so, no two of them sit within the seed ring's two strides of each other.
export function interleave<T>({ sparse, dense }: { sparse: T[]; dense: T[] }): T[] {
	const out: T[] = [];
	let next = 0;
	dense.forEach((item, i) => {
		out.push(item);
		while (next < sparse.length && (next + 1) * dense.length <= (i + 1) * sparse.length) {
			out.push(sparse[next++]);
		}
	});
	return [...out, ...sparse.slice(next)];
}

const isMaia = (bot: TournamentBot): boolean => bot.definition.maia !== undefined;

// Two Maia animals never meet: both ask the same model, so their game tells the fit little the
// land and monster games don't, at two model runs per move pair — ~40% of the arena's Maia moves.
// The seed pairs ring neighbours, so they are spread along it, not left in a block cut adrift.
export function field(bots: readonly TournamentBot[]): {
	ids: string[];
	playable: (a: string, b: string) => boolean;
} {
	const sparse = bots.filter((bot) => isMaia(bot));
	const dense = bots.filter((bot) => !isMaia(bot));
	const maia = new Set(sparse.map((bot) => bot.id));
	const ids = interleave({ sparse, dense }).map((bot) => bot.id);
	return { ids, playable: (a, b) => !(maia.has(a) && maia.has(b)) };
}
