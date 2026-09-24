import type { Messages } from "../types";
import about from "./about";
import bots from "./bots";
import feature from "./feature";
import game from "./game";
import monsterBots from "./monsters";
import talk from "./talk";
import underwaterBots from "./underwater";

const messages: Messages = {
	app: {
		tagline: "Каждый зверь играет в шахматы по-своему странно. Обыграешь хоть одного?",
	},
	nav: {
		roster: "Зверинец",
		play: "Игра",
		about: "О проекте",
		underwater: "Под водой",
		monsters: "Монстры",
	},
	locale: {
		label: "Язык",
		en: "English",
		ru: "Русский",
	},
	board: {
		promotion: "Выберите фигуру",
		piece: { queen: "Ферзь", rook: "Ладья", bishop: "Слон", knight: "Конь" },
	},
	bot: { ...bots, ...monsterBots, ...underwaterBots },
	roster: {
		lead: "Каждый зверь играет в шахматы по-своему странно. Обыграешь хоть одного?",
		// Always "очков": points are rounded to tens, and a number ending in 0 takes it.
		points: "{points} очков",
	},
	underwater: {
		lead: "Тут все играют, как люди. Обыграешь хоть одного?",
	},
	monsters: {
		lead: "Эти играют намного сильнее. Обыграешь хоть одного?",
	},
	about,
	game,
	talk,
	feature,
	placeholder: {
		notBuiltYet: "Эту страницу еще строим.",
	},
};

export default messages;
