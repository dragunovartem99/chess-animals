import about from "./about";
import bots from "./bots";
import feature from "./feature";
import frankenstein from "./frankenstein";
import game from "./game";
import seaBots from "./sea";

export default {
	app: {
		title: "Chess Animals",
		tagline: "Every animal plays chess its own strange way. Can you beat one?",
	},
	nav: {
		roster: "Roster",
		play: "Play",
		about: "About",
		frankenstein: "Frankenstein",
		underwater: "Underwater",
	},
	locale: {
		label: "Language",
		en: "English",
		ru: "Русский",
	},
	board: {
		promotion: "Choose a piece",
		piece: { queen: "Queen", rook: "Rook", bishop: "Bishop", knight: "Knight" },
	},
	bot: { ...bots, ...seaBots },
	roster: {
		lead: "Every animal plays chess its own strange way. Can you beat one?",
	},
	underwater: {
		lead: "Down here they play much better. Can you beat one?",
	},
	about,
	game,
	feature,
	frankenstein,
	placeholder: {
		notBuiltYet: "Still building this one.",
	},
};
