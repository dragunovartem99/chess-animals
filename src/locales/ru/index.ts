import type { Messages } from "../types";
import bots from "./bots";
import feature from "./feature";

const messages: Messages = {
	app: {
		title: "Шахматы с животными",
		tagline: "Шахматные боты с характерами животных, ранжируемые за секунды",
	},
	nav: {
		roster: "Зверинец",
		play: "Игра",
		arena: "Арена",
		tuner: "Настройка",
		about: "О проекте",
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
	bot: bots,
	game: {
		breakdown: {
			title: "Что видит {name}",
			absolute: "плюс — перевес белых; очки = значение × вес",
			total: "Итого",
			phase: "эндшпиль: {phase}%",
			feature: "Эвристика",
			amount: "Значение",
			weight: "Вес",
			points: "Очки",
		},
		tab: { moves: "Ходы", breakdown: "Разбор" },
		human: "Вы",
		restart: "Новая партия",
		thinking: "Думает…",
		evaluation: "Оценка",
		turn: { white: "Белые", black: "Чёрные" },
		reason: {
			"checkmate": "Мат",
			"stalemate": "Пат",
			"insufficient-material": "Ничья — недостаточно материала",
			"fifty-move": "Ничья — правило пятидесяти ходов",
			"repetition": "Ничья — троекратное повторение",
			"ply-limit": "Ничья по регламенту — исчерпан лимит ходов",
		},
	},
	feature,
	placeholder: {
		notBuiltYet: "Ещё не готово.",
	},
};

export default messages;
