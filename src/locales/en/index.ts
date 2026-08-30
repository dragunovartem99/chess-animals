import feature from "./feature";

export default {
	app: {
		title: "Chess Animals",
		tagline: "Chess bots with animal personalities, ranked in seconds",
	},
	nav: {
		roster: "Roster",
		play: "Play",
		arena: "Arena",
		tuner: "Tuner",
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
	bot: {
		donkey: {
			name: "Donkey",
			description:
				"Picks a legal move at random. The reference point every rating is measured from.",
		},
		wolf: {
			name: "Wolf",
			description: "Throws every piece at the enemy king and thinks no further.",
		},
		turtle: {
			name: "Turtle",
			description: "Builds a wall around its own king and waits.",
		},
	},
	game: {
		breakdown: {
			title: "What {name} sees",
			absolute: "a plus means White is better; points = amount × weight",
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
