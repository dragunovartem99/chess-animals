import type { Messages } from "../types";
import bots from "./bots";
import feature from "./feature";

const messages: Messages = {
	app: {
		title: "Шахматы с животными",
		tagline: "У каждого бота одна мысль про шахматы, и она неправильная. Обыграй его.",
	},
	nav: {
		roster: "Зверинец",
		play: "Игра",
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
	roster: {
		lead: "У каждого зверя ровно один прием. Выбери и попробуй обыграть.",
	},
	game: {
		breakdown: {
			title: "Что видит {name}",
			absolute: "Плюс — хорошо для белых, минус — для черных. Очки = Значение × Вес.",
			total: "Итого",
			phase: "эндшпиль: {phase}%",
			feature: "Параметр",
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
		notBuiltYet: "Эту страницу еще строим.",
	},
};

export default messages;
