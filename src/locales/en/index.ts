import bots from "./bots";
import feature from "./feature";

export default {
	app: {
		title: "Chess Animals",
		tagline: "Chess bots with animal personalities, ranked in seconds",
	},
	nav: {
		roster: "Roster",
		play: "Play",
		about: "About",
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
	bot: bots,
	roster: {
		lead: "Each animal plays with one stubborn idea. Tap one to take it on.",
	},
	game: {
		breakdown: {
			title: "What {name} sees",
			absolute: "Positive numbers favour White. Points = Amount × Weight.",
			total: "Total",
			phase: "{phase}% endgame",
			feature: "Parameter",
			amount: "Amount",
			weight: "Weight",
			points: "Points",
		},
		tab: { moves: "Moves", breakdown: "Breakdown" },
		human: "You",
		restart: "New game",
		thinking: "Thinking…",
		evaluation: "Evaluation",
		turn: { white: "White", black: "Black" },
		reason: {
			"checkmate": "Checkmate",
			"stalemate": "Stalemate",
			"insufficient-material": "Draw — not enough material",
			"fifty-move": "Draw — fifty-move rule",
			"repetition": "Draw — threefold repetition",
			"ply-limit": "Adjudicated a draw — move limit reached",
		},
	},
	feature,
	placeholder: {
		notBuiltYet: "Not built yet.",
	},
};
