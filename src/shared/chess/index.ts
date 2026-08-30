export { gameStatus } from "./outcome";
export { gamePhase } from "./phase";
export {
	afterMove,
	fenFromPosition,
	hasLegalMove,
	legalCaptures,
	legalMoves,
	positionFromFen,
	PROMOTION_ROLES,
	repetitionKey,
} from "./position";
export type { EndReason, GameResult, GameStatus } from "./types";
