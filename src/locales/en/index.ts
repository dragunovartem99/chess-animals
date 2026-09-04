import bots from "./bots";
import feature from "./feature";

export default {
	app: {
		title: "Chess Animals",
		tagline: "Every bot here is sure of one wrong thing about chess. Prove it wrong.",
	},
	nav: {
		roster: "Roster",
		play: "Play",
		about: "About",
		frankenstein: "Frankenstein",
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
		lead: "Every animal here has exactly one trick. Tap one and take it on.",
	},
	game: {
		breakdown: {
			title: "What {name} sees",
			absolute: "Plus is good for White, minus is good for Black. Points = Amount × Weight.",
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
		turn: { white: "White", black: "Black" },
		toMove: { white: "White to move", black: "Black to move" },
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
	frankenstein: {
		title: "Frankenstein",
		depth: "Depth",
		quiescence: "Quiescence search",
		seed: { blank: "Default" },
		autoplay: "Autoplay",
		pause: "Pause",
		step: "Step",
		reset: "Reset",
		copy: "Copy weights",
		tab: { weights: "Weights", breakdown: "Breakdown" },
		family: {
			material: "Material",
			positional: "Positional",
			pawns: "Pawns",
			king: "King safety",
			behavioural: "Behavioural",
			move: "Move",
		},
	},
	placeholder: {
		notBuiltYet: "Still building this one.",
	},
};
