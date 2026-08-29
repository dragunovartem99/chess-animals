import type { GoLimits, UciCommand } from "./types";

const NUMERIC_LIMITS = new Set(["depth", "nodes", "movetime"]);

// `setoption name Some Long Name value 12` — the name may contain spaces, so it runs to the
// `value` keyword rather than to the next word.
function parseSetOption(tokens: string[]): UciCommand {
	const valueAt = tokens.indexOf("value");
	const nameAt = tokens.indexOf("name");
	const end = valueAt === -1 ? tokens.length : valueAt;
	const name = tokens.slice(nameAt + 1, end).join(" ");

	return valueAt === -1
		? { type: "setoption", name }
		: { type: "setoption", name, value: tokens.slice(valueAt + 1).join(" ") };
}

// `position startpos moves e2e4 e7e5` or `position fen <six fields> moves ...`. An absent `fen`
// means the standard opening position.
function parsePosition(tokens: string[]): UciCommand {
	const movesAt = tokens.indexOf("moves");
	const moves = movesAt === -1 ? [] : tokens.slice(movesAt + 1);

	if (tokens[0] !== "fen") return { type: "position", moves };

	const end = movesAt === -1 ? tokens.length : movesAt;

	return { type: "position", fen: tokens.slice(1, end).join(" "), moves };
}

function parseGo(tokens: string[]): UciCommand {
	const limits: GoLimits = {};

	for (const [index, token] of tokens.entries()) {
		if (!NUMERIC_LIMITS.has(token)) continue;

		const value = Number(tokens[index + 1]);
		if (Number.isFinite(value)) limits[token as keyof GoLimits] = value;
	}

	return { type: "go", limits };
}

export function parseCommand(line: string): UciCommand {
	const [keyword, ...rest] = line.trim().split(/\s+/u);

	switch (keyword) {
		case "uci":
		case "isready":
		case "ucinewgame":
		case "stop":
		case "quit":
			return { type: keyword };
		case "setoption":
			return parseSetOption(rest);
		case "position":
			return parsePosition(rest);
		case "go":
			return parseGo(rest);
		default:
			return { type: "unknown", line };
	}
}
