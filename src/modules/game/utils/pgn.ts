import type { GameStatus } from "@/shared/chess";
import type { PlayedTurn } from "@/shared/game";

function result(status: GameStatus): string {
	if (!status.over) return "*";
	if (status.result === null) return "1/2-1/2";

	return status.result === "white" ? "1-0" : "0-1";
}

// Just the tags an importer reads — who played and how it ended — and the moves in English SAN,
// which is what every PGN reader expects whatever the page's locale.
export function toPgn({
	turns,
	white,
	black,
	status,
}: {
	turns: PlayedTurn[];
	white: string;
	black: string;
	status: GameStatus;
}): string {
	const score = result(status);
	const moves = turns.map(({ ply, san }) => (ply % 2 === 1 ? `${(ply + 1) / 2}. ${san}` : san));

	return [
		`[White "${white}"]`,
		`[Black "${black}"]`,
		`[Result "${score}"]`,
		"",
		[...moves, score].join(" "),
		"",
	].join("\n");
}
