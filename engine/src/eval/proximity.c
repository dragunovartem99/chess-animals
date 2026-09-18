#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "masks.h"
#include "position.h"

typedef struct {
	double to_ours;
	double to_theirs;
} Distances;

// An army's mean distance to each king — the mean, not the total, so a side ahead in material
// does not read as the worse swarmer. Doubles, divided once, as the TS numbers are.
static Distances mean_distances(const Position *pos, Color color, Square ours, Square theirs) {
	int to_ours = 0;
	int to_theirs = 0;
	int count = 0;
	for (Bitboard army = pos->colors[color]; army != 0; count++) {
		Square square = bb_pop(&army);
		to_ours += chebyshev(square, ours);
		to_theirs += chebyshev(square, theirs);
	}
	return (Distances){.to_ours = (double)to_ours / count, .to_theirs = (double)to_theirs / count};
}

// `extractProximity`: the distance strategies in king moves, negated so more is nearer and a
// positive weight is the charge each key names. An army always holds its king, so no mean ever
// divides by zero.
void extract_proximity(EvalContext *ctx, float *features) {
	const Position *pos = ctx->pos;
	Square our_king = bb_first(pos->roles[KING] & pos->colors[ctx->us]);
	Square their_king = bb_first(pos->roles[KING] & pos->colors[ctx->them]);
	Distances ours = mean_distances(pos, ctx->us, our_king, their_king);
	// From their side the kings swap roles: `to_ours` is their army's distance to our king.
	Distances theirs = mean_distances(pos, ctx->them, our_king, their_king);
	features[FEATURE_SWARM] = (float)(theirs.to_ours - ours.to_theirs);
	features[FEATURE_HUDDLE] = (float)(theirs.to_theirs - ours.to_ours);
	features[FEATURE_KING_PROXIMITY] = (float)-chebyshev(our_king, their_king);
}
