import type { Messages } from "../types";
import bots from "./bots";
import feature from "./feature";

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
		lead: "Каждый зверь играет в шахматы по-своему странно. Обыграешь хоть одного?",
	},
	game: {
		breakdown: {
			title: "Что видит {name}",
			absolute: "Плюс — хорошо для белых, минус — для черных. Очки = Значение × Вес.",
			total: "Итого",
			feature: "Параметр",
			amount: "Значение",
			weight: "Вес",
			points: "Очки",
		},
		tab: { moves: "Ходы", breakdown: "Разбор" },
		human: "Вы",
		restart: "Новая партия",
		thinking: "Думает…",
		turn: { white: "Белые", black: "Чёрные" },
		toMove: { white: "Ход белых", black: "Ход чёрных" },
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
	frankenstein: {
		title: "Франкенштейн",
		depth: "Глубина",
		quiescence: "Тихий поиск",
		seed: { blank: "По умолчанию" },
		autoplay: "Автоигра",
		pause: "Пауза",
		step: "Шаг",
		reset: "Сброс",
		copy: "Скопировать веса",
		tab: { weights: "Веса", breakdown: "Разбор" },
		family: {
			material: "Материал",
			positional: "Позиционные",
			pawns: "Пешки",
			king: "Безопасность короля",
			behavioural: "Поведенческие",
			move: "Ход",
		},
	},
	placeholder: {
		notBuiltYet: "Эту страницу еще строим.",
	},
};

export default messages;
