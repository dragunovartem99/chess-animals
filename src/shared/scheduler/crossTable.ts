import type { Matchup } from "../rating";

export type CrossRow = {
	id: string;
	// Points against each id in `ids` order — a win is 1, a draw ½ — or null on the diagonal.
	cells: (number | null)[];
	points: number;
	games: number;
};

export type CrossTable = { ids: string[]; rows: CrossRow[] };

// The head-to-head score grid. Colors are folded together: a cell is everything the row bot
// scored against the column bot, from either side. The row order is the caller's; sorting it by
// `points` should reproduce the rating order, which is the tournament's headline sanity check.
export function crossTable({
	ids,
	matchups,
}: {
	ids: readonly string[];
	matchups: readonly Matchup[];
}): CrossTable {
	const points = new Map<string, Map<string, { score: number; games: number }>>();
	const cell = (a: string, b: string) => {
		const row = points.get(a) ?? new Map();
		points.set(a, row);
		const entry = row.get(b) ?? { score: 0, games: 0 };
		row.set(b, entry);
		return entry;
	};

	for (const m of matchups) {
		const games = m.whiteWins + m.blackWins + m.draws;
		cell(m.white, m.black).score += m.whiteWins + m.draws / 2;
		cell(m.white, m.black).games += games;
		cell(m.black, m.white).score += m.blackWins + m.draws / 2;
		cell(m.black, m.white).games += games;
	}

	const rows = ids.map((id) => {
		const cells = ids.map((other) => (other === id ? null : cell(id, other).score));
		return {
			id,
			cells,
			points: cells.reduce((sum: number, value) => sum + (value ?? 0), 0),
			games: ids.reduce((sum, other) => sum + (other === id ? 0 : cell(id, other).games), 0),
		};
	});

	return { ids: [...ids], rows };
}
