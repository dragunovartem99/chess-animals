// What the stickers are printed in, per world: `paper` fills the discs, labels and tagline and
// haloes the floating pieces, `ink` outlines them, `deep` is the title's drop and the labels'
// text, and `shade` (bare `r,g,b`, so each caller picks its own alpha) is the shadow under it all.
export type Palette = { paper: string; ink: string; deep: string; shade: string };

export type World = { svg: string; palette: Palette };
