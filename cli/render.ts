import type { RatingResult } from "@/shared/rating";
import type { CrossTable } from "@/shared/scheduler";

const CI = 1.96;

// The rating table: rank, id, Elo, and the 95% interval half-width, strongest first.
export function renderRatingTable(rating: RatingResult): string {
	const ranked = rating.players.toSorted((a, b) => b.rating - a.rating);
	const header = `white advantage ${Math.round(rating.whiteAdvantage)} Elo   draw ν ${rating.drawParam.toFixed(2)}`;
	const rows = ranked.map((player, i) => {
		const rank = String(i + 1).padStart(2);
		const elo = String(Math.round(player.rating)).padStart(5);
		const ci = String(Math.round(CI * player.stderr)).padStart(3);
		return `${rank}  ${player.id.padEnd(14)} ${elo}  ±${ci}`;
	});
	return [header, ...rows].join("\n");
}

const label = (id: string) => id.slice(0, 6).padStart(7);

// The head-to-head grid, rows already in rating order so the scores should trend down the table.
export function renderCrossTable(table: CrossTable): string {
	const header = ["".padEnd(14), ...table.ids.map((id) => label(id)), "   total"].join("");
	const rows = table.rows.map((row) => {
		const cells = row.cells.map((cell) =>
			cell === null ? "—".padStart(7) : cell.toFixed(1).padStart(7)
		);
		return `${row.id.padEnd(14)}${cells.join("")}   ${row.points.toFixed(1)}/${row.games}`;
	});
	return [header, ...rows].join("\n");
}
