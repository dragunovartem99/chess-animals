import about from "./about";
import bots from "./bots";
import feature from "./feature";
import game from "./game";
import monsterBots from "./monsters";
import talk from "./talk";
import underwaterBots from "./underwater";

export default {
	app: {
		tagline: "Every animal plays chess its own strange way. Can you beat one?",
	},
	nav: {
		roster: "Roster",
		play: "Play",
		about: "About",
		underwater: "Underwater",
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
		points: "{points} points",
	},
	underwater: {
		lead: "Down here everyone plays the way people do. Can you beat one?",
	},
	monsters: {
		lead: "These ones play much better. Can you beat one?",
	},
	about,
	game,
	talk,
	feature,
	placeholder: {
		notBuiltYet: "Still building this one.",
	},
};
