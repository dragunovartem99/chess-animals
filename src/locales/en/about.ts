export default {
	title: "About",
	lede: "Chess bots with a personality each, from worse than any person to stronger than most — a place to play them, and one rating that ranks them all.",
	bots: {
		title: "How the bots work",
		body: "The bots come in three rosters, and each runs on its own engine:",
		land: "Land animals share one small engine written for this site. A move is scored as the dot product of a feature vector describing the position and a weight vector unique to each animal: the Wolf drives straight at the enemy king, the Goat chases checks and captures, the Donkey leaves every weight at zero and moves at random.",
		underwater:
			"Underwater animals are Maia, a network trained on Lichess games to play like people. Each one is asked to play at a different rating, from the Shrimp to the Whale.",
		monsters:
			"Monsters are Stockfish, one of the strongest engines there is, held back. Each looks at its best few moves and now and then picks a worse one; the weaker the monster, the more often and the worse. The Dragon never slips.",
	},
	points: {
		title: "What the stars mean",
		body: "Every bot plays every other in a big tournament, and its results become points. Maia plays like people at a known rating, so the whole scale is pinned to the underwater animals: a bot's points read roughly like a Lichess rating. The weakest animals are worse than any person, so their points go below zero.",
	},
	paper: {
		title: "Background",
		body: "The project is inspired by Tom 7's Elo World (SIGBOVIK 2019), where a field of deliberately weak engines plays itself to stretch the usual rating scale down toward zero and below.",
	},
	engines: {
		title: "Open source inside",
		stockfish: {
			name: "Stockfish.js 19",
			role: "plays the monsters and tells the animals when to speak.",
			license: "GNU GPL v3",
		},
		maia: {
			name: "Maia-3",
			role: "from the University of Toronto's CSSLab plays the underwater animals.",
			license: "GNU AGPL v3",
		},
		source: "Source",
	},
	credit: {
		title: "About the author",
		body: "Made by Artem Dragunov.",
	},
	links: {
		paper: "Read the original",
		source: "Source on GitHub",
	},
};
