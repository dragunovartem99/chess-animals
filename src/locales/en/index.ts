import about from "./about";
import bots from "./bots";
import feature from "./feature";
import frankenstein from "./frankenstein";
import game from "./game";
import monsterBots from "./monsters";
import underwaterBots from "./underwater";

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
		monsters: "Monsters",
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
	bot: { ...bots, ...monsterBots, ...underwaterBots },
	roster: {
		lead: "Every animal plays chess its own strange way. Can you beat one?",
	},
	monsters: {
		lead: "These ones play much better. Can you beat one?",
	},
	about,
	game,
	feature,
	frankenstein,
	placeholder: {
		notBuiltYet: "Still building this one.",
	},
};
