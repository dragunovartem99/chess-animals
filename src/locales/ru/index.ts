import type { Messages } from "../types";

const messages: Messages = {
	app: {
		title: "Шахматные звери",
		tagline: "Шахматные боты с характерами зверей, ранжируемые за секунды",
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
	feature: {
		materialPawn: "Ценность пешки",
		materialKnight: "Ценность коня",
		materialBishop: "Ценность слона",
		materialRook: "Ценность ладьи",
		materialQueen: "Ценность ферзя",
		centralizationPawn: "Централизация пешки",
		centralizationKnight: "Централизация коня",
		centralizationBishop: "Централизация слона",
		centralizationRook: "Централизация ладьи",
		centralizationQueen: "Централизация ферзя",
		centralizationKing: "Централизация короля",
		advancementPawn: "Продвижение пешки",
		advancementKnight: "Продвижение коня",
		advancementBishop: "Продвижение слона",
		advancementRook: "Продвижение ладьи",
		advancementQueen: "Продвижение ферзя",
		advancementKing: "Продвижение короля",
		bishopPair: "Пара слонов",
		rookOpenFile: "Ладья на открытой линии",
		rookSeventh: "Ладья на седьмой",
		knightOutpost: "Форпост коня",
		centerControl: "Контроль центра",
		space: "Пространство",
		hanging: "Незащищённые фигуры",
		mobility: "Подвижность",
		safeMobility: "Безопасная подвижность",
		tempo: "Темп",
	},
	placeholder: {
		notBuiltYet: "Ещё не готово.",
	},
};

export default messages;
