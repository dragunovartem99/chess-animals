import { INITIAL_FEN } from "chessops/fen";

// A spread of shapes rather than one position: a bare endgame walks far fewer pieces than a full
// middlegame, and the arena plays both. Shared by the benchmark and the budget test so the two
// can never drift into measuring different work.
export const BENCHMARK_POSITIONS = [
	INITIAL_FEN,
	"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
	"r2q1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPQ1BPPP/R1B2RK1 w - - 0 10",
	"8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 40",
	"4k3/8/8/8/8/8/8/4K3 w - - 0 1",
];
