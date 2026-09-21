import type { Messages } from "../types";
import about from "./about";
import bots from "./bots";
import feature from "./feature";
import frankenstein from "./frankenstein";
import game from "./game";
import seaBots from "./sea";

const messages: Messages = {
	app: {
		title: "Шахматы с животными",
		tagline: "Каждый зверь играет в шахматы по-своему странно. Обыграешь хоть одного?",
	},
	nav: {
		roster: "Зверинец",
		play: "Игра",
		about: "О проекте",
		frankenstein: "Франкенштейн",
		underwater: "Под водой",
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
	bot: { ...bots, ...seaBots },
	roster: {
		lead: "Каждый зверь играет в шахматы по-своему странно. Обыграешь хоть одного?",
	},
	underwater: {
		lead: "Тут звери играют намного сильнее. Обыграешь хоть одного?",
	},
	about,
	game,
	feature,
	frankenstein,
	placeholder: {
		notBuiltYet: "Эту страницу еще строим.",
	},
};

export default messages;
