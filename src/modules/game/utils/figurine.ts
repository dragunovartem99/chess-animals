// SAN's letters are English (N reads as nothing in Russian), so the move list shows figurines.
// Always the white set, drawn in lichess's figurine face (style.css).
const FIGURINES: Record<string, string> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘" };

// Every capital in SAN is a piece — files are lower case and castling is spelt with O, not a
// letter this map knows — so a promotion's `=Q` is caught along with the leading piece.
export const figurine = ({ san }: { san: string }) =>
	san.replaceAll(/[KQRBN]/gu, (letter) => FIGURINES[letter]);
