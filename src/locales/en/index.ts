import bots from "./bots";
import feature from "./feature";

export default {
	app: {
		title: "Chess Animals",
		tagline: "Every animal plays chess its own strange way. Can you beat one?",
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
		lead: "Every animal plays chess its own strange way. Can you beat one?",
	},
	about: {
		title: "About",
		lede: "A collection of deliberately weak chess bots, each with its own personality — a place to play them and a shared rating that ranks their strength.",
		bots: {
			title: "How the bots work",
			body: "Every bot runs on the same engine. A move is scored as the dot product of a feature vector describing the position and a weight vector unique to that bot.",
			listLead: "A bot's character is defined by its weights:",
			wolf: "The Wolf drives straight at the enemy king.",
			monkey: "The Monkey grabs any capture it can.",
			donkey: "The Donkey leaves every weight at zero and moves at random.",
		},
		paper: {
			title: "Background",
			body: "The project is inspired by Tom 7's Elo World (SIGBOVIK 2019), where a field of deliberately weak engines plays itself to stretch the usual rating scale down toward zero and below.",
		},
		credit: {
			title: "About the author",
			body: "Created by Artem Dragunov. Links to the source and to the original talk are below.",
		},
		links: {
			paper: "Elo World",
			source: "Source on GitHub",
		},
	},
	game: {
		breakdown: {
			title: "What {name} sees",
			absolute: "Plus is good for White, minus is good for Black. Points = Amount × Weight.",
			total: "Total",
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
