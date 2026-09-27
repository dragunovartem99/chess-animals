import { afterMove, fenFromPosition, positionFromFen } from "../../chess";
import { fromUci } from "../../engine/uci/moves";
import { moveFacts } from "../facts";

// The facts of the last of `moves` played from `fen`.
export function factsOf({ fen, moves }: { fen: string; moves: string[] }) {
	let position = positionFromFen(fen);
	const fens = [fen];
	for (const uci of moves.slice(0, -1)) {
		position = afterMove({ position, move: fromUci({ position, uci })! });
		fens.push(fenFromPosition(position));
	}

	return moveFacts({ fens, moves, ply: moves.length });
}
