// SAN's piece letters are English — N for a knight reads as nothing in Russian, which would want
// К. Figurines read the same in every locale, so the move list shows those instead and no
// locale needs its own letters. The letters stay in `san` itself, for anything machine-read.
// Always the white set: figurine notation uses one set for both sides. They are drawn in lichess's
// own figurine face (style.css), since no text font carries them at a matching size.
const FIGURINES: Record<string, string> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘" };

// Every capital in SAN is a piece — files are lower case and castling is spelt with O, not a
// letter this map knows — so a promotion's `=Q` is caught along with the leading piece.
export const figurine = ({ san }: { san: string }) =>
	san.replaceAll(/[KQRBN]/gu, (letter) => FIGURINES[letter]);
