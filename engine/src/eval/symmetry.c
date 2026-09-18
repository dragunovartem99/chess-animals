#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "position.h"

static const Bitboard DARK_SQUARES = 0xaa55aa55aa55aa55U;

// A square's mirror across the ranks is one exclusive-or away, and never the square itself.
enum { FLIP_RANKS = 56 };

// The paper's scoring: a man facing his opposite number costs nothing, the wrong man of the right
// colour a little, an empty square more. A pair of occupied squares is scored from the lower one.
static int asymmetry(const Position *pos) {
	int penalty = 0;
	for (Bitboard occupied = pos->colors[WHITE] | pos->colors[BLACK]; occupied != 0;) {
		Square square = bb_pop(&occupied);
		Square mirror = square ^ FLIP_RANKS;
		Piece here = pos->board[square];
		Piece there = pos->board[mirror];
		if (there == PIECE_NONE) {
			penalty += 2;
		} else if (mirror > square) {
			bool same_colour = piece_color(here) == piece_color(there);
			bool same_role = piece_role(here) == piece_role(there);
			penalty += same_colour ? 2 : !same_role;
		}
	}
	return penalty;
}

// Men standing on squares of their own colour: White on light, Black on dark.
static int on_own_colour(const Position *pos, Color color) {
	Bitboard own = color == WHITE ? ~DARK_SQUARES : DARK_SQUARES;
	return bb_count(pos->colors[color] & own);
}

// `extractSymmetry`: shape, not strength. The mirror is negated after the conversion, so a
// perfect mirror reads -0 as the TS `-asymmetry(...)` does, and the bits still match.
void extract_symmetry(EvalContext *ctx, float *features) {
	const Position *pos = ctx->pos;
	features[FEATURE_SAME_COLOR_SQUARES] =
	    (float)(on_own_colour(pos, ctx->us) - on_own_colour(pos, ctx->them));
	features[FEATURE_MIRROR_RANKS] = -(float)asymmetry(pos);
}
