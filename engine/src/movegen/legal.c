#include <stdbool.h>

#include "attacks.h"
#include "bitboard.h"
#include "move.h"
#include "movegen.h"
#include "position.h"

Bitboard attackers_to(const Position *pos, Square square, Color attacker, Bitboard occupied) {
	Bitboard diagonal = pos->roles[BISHOP] | pos->roles[QUEEN];
	Bitboard straight = pos->roles[ROOK] | pos->roles[QUEEN];
	return pos->colors[attacker] & ((pawn_attacks(opposite(attacker), square) & pos->roles[PAWN]) |
	                                (knight_attacks(square) & pos->roles[KNIGHT]) |
	                                (bishop_attacks(square, occupied) & diagonal) |
	                                (rook_attacks(square, occupied) & straight) |
	                                (king_attacks(square) & pos->roles[KING]));
}

MoveContext move_context(const Position *pos) {
	Color them = opposite(pos->turn);
	Bitboard occupied = pos->colors[WHITE] | pos->colors[BLACK];
	Square king = bb_first(pos->roles[KING] & pos->colors[pos->turn]);
	Bitboard snipers =
	    pos->colors[them] & ((rook_attacks(king, 0) & (pos->roles[ROOK] | pos->roles[QUEEN])) |
	                         (bishop_attacks(king, 0) & (pos->roles[BISHOP] | pos->roles[QUEEN])));
	MoveContext ctx = {.king = king, .checkers = attackers_to(pos, king, them, occupied)};
	while (snipers != 0) {
		Bitboard blocking = between(king, bb_pop(&snipers)) & occupied;
		ctx.blockers |= bb_many(blocking) ? 0 : blocking;
	}
	return ctx;
}

// chessops's `canCaptureEp`: the capture lifts two pawns off one rank at once, which no pin mask
// sees, so the king's safety is asked of the board as it would stand after it.
static bool can_capture_ep(const Position *pos, const MoveContext *ctx, Square from) {
	if (pos->ep == SQUARE_NONE || !bb_has(pawn_attacks(pos->turn, from), pos->ep)) {
		return false;
	}
	Square captured = pos->turn == WHITE ? pos->ep - 8 : pos->ep + 8;
	Bitboard occupied =
	    ((pos->colors[WHITE] | pos->colors[BLACK]) ^ square_bb(from) ^ square_bb(captured)) |
	    square_bb(pos->ep);
	Bitboard attackers = attackers_to(pos, ctx->king, opposite(pos->turn), occupied);
	return (attackers & ~square_bb(captured)) == 0;
}

static Bitboard pawn_dests(const Position *pos, Square from, Bitboard occupied) {
	int forward = pos->turn == WHITE ? 8 : -8;
	Square step = (Square)(from + forward);
	Bitboard dests = pawn_attacks(pos->turn, from) & pos->colors[opposite(pos->turn)];
	if (!bb_has(occupied, step)) {
		dests |= square_bb(step);
		bool home = pos->turn == WHITE ? from < 16 : from >= 48;
		Square double_step = (Square)(step + forward);
		dests |= home && !bb_has(occupied, double_step) ? square_bb(double_step) : 0;
	}
	return dests;
}

// A king may step anywhere not attacked once it has left — lifted off the board, so a slider
// checking along the line it retreats on still covers the square behind it.
static Bitboard king_dests(const Position *pos, const MoveContext *ctx, Bitboard occupied) {
	Bitboard dests = king_attacks(ctx->king) & ~pos->colors[pos->turn];
	Bitboard safe = 0;
	for (Bitboard rest = dests; rest != 0;) {
		Square to = bb_pop(&rest);
		Bitboard attackers =
		    attackers_to(pos, to, opposite(pos->turn), occupied ^ square_bb(ctx->king));
		safe |= attackers == 0 ? square_bb(to) : 0;
	}
	return safe | castling_dests(pos, ctx);
}

Bitboard legal_dests(const Position *pos, const MoveContext *ctx, Square from) {
	Bitboard occupied = pos->colors[WHITE] | pos->colors[BLACK];
	Piece piece = pos->board[from];
	if (piece_role(piece) == KING) {
		return king_dests(pos, ctx, occupied);
	}
	Bitboard dests = piece_role(piece) == PAWN
	                     ? pawn_dests(pos, from, occupied)
	                     : piece_attacks(piece, from, occupied) & ~pos->colors[pos->turn];
	if (bb_many(ctx->checkers)) {
		return 0;
	}
	if (ctx->checkers != 0) {
		dests &= between(bb_first(ctx->checkers), ctx->king) | ctx->checkers;
	}
	if (bb_has(ctx->blockers, from)) {
		dests &= line(from, ctx->king);
	}
	// En passant joins after the check and pin masks, as in chessops: `can_capture_ep` has
	// already asked the only question that matters for it.
	bool ep = piece_role(piece) == PAWN && can_capture_ep(pos, ctx, from);
	return ep ? dests | square_bb(pos->ep) : dests;
}

// What a list would hold, asked of one move — the table's move is played before any list exists.
bool is_legal_move(const Position *pos, Move move) {
	Square from = move_from(move);
	Square to = move_to(move);
	Piece piece = pos->board[from];
	if (piece == PIECE_NONE || piece_color(piece) != pos->turn) {
		return false;
	}
	MoveContext ctx = move_context(pos);
	if (!bb_has(legal_dests(pos, &ctx, from), to)) {
		return false;
	}
	bool promoting = piece_role(piece) == PAWN && (square_rank(to) == 0 || square_rank(to) == 7);
	Role promotion = move_promotion(move);
	return promoting ? promotion >= KNIGHT && promotion <= QUEEN : promotion == PAWN;
}
