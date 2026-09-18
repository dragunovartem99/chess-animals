import { INITIAL_FEN } from "chessops/fen";

// A spread of shapes the search actually meets across a game — a crowded opening, a sharp
// middlegame with tactics to prune, a quiet manoeuvring position, and a sparse endgame where
// branching is low but depth runs long. Shared by the benchmark and the budget test so the two
// can never drift into measuring different work.
export const SEARCH_POSITIONS = [
	INITIAL_FEN,
	"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
	"r2q1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPQ1BPPP/R1B2RK1 w - - 0 10",
	"r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 11",
	"8/2p2pk1/1p4p1/p2Pp2p/P3P2P/1P3PP1/2P3K1/8 w - - 0 30",
	"8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 40",
] as const;
