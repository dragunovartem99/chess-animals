export default {
	title: "About",
	lede: "A collection of deliberately weak chess bots, each with its own personality — a place to play them and a shared rating that ranks their strength.",
	bots: {
		title: "How the bots work",
		body: "Every bot runs on the same engine. A move is scored as the dot product of a feature vector describing the position and a weight vector unique to that bot.",
		listLead: "A bot's character is defined by its weights:",
		wolf: "The Wolf drives straight at the enemy king.",
		goat: "The Goat chases checks, then captures, and never counts the cost.",
		donkey: "The Donkey leaves every weight at zero and moves at random.",
	},
	points: {
		title: "What the stars mean",
		body: "Every bot plays every other in a big tournament, and its results become points. The underwater animals are Maia, a model trained on Lichess games to play like people at a chosen rating, so the whole scale is pinned to them: a bot's points read roughly like a Lichess rating. The weakest animals are worse than any person, so their points go below zero.",
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
};
