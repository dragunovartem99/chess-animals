import type { ScoreValue, UciResponse } from "./types";

function readNumber(tokens: string[], keyword: string): number | undefined {
	const at = tokens.indexOf(keyword);
	if (at === -1) return undefined;

	const value = Number(tokens[at + 1]);

	return Number.isFinite(value) ? value : undefined;
}

function readScore(tokens: string[]): ScoreValue | undefined {
	const at = tokens.indexOf("score");
	if (at === -1) return undefined;

	const value = Number(tokens[at + 2]);
	if (!Number.isFinite(value)) return undefined;

	if (tokens[at + 1] === "mate") return { kind: "mate", moves: value };

	return tokens[at + 1] === "cp" ? { kind: "cp", value } : undefined;
}

// `info` carries whatever the engine felt like reporting, in any order, and a reader is expected
// to take the fields it knows and ignore the rest. `pv` is always last, since it runs to the end
// of the line.
function parseInfo(tokens: string[]): UciResponse {
	const pvAt = tokens.indexOf("pv");

	return {
		type: "info",
		depth: readNumber(tokens, "depth"),
		nodes: readNumber(tokens, "nodes"),
		score: readScore(tokens),
		pv: pvAt === -1 ? undefined : tokens.slice(pvAt + 1),
	};
}

function parseOption(tokens: string[]): UciResponse {
	const typeAt = tokens.indexOf("type");
	const defaultAt = tokens.indexOf("default");
	const name = tokens
		.slice(tokens.indexOf("name") + 1, typeAt === -1 ? tokens.length : typeAt)
		.join(" ");

	return {
		type: "option",
		name,
		optionType: typeAt === -1 ? "string" : tokens[typeAt + 1],
		default: defaultAt === -1 ? undefined : tokens[defaultAt + 1],
	};
}

export function parseResponse(line: string): UciResponse {
	const [keyword, ...rest] = line.trim().split(/\s+/u);

	switch (keyword) {
		case "uciok":
		case "readyok":
			return { type: keyword };
		case "id":
			return rest[0] === "name" || rest[0] === "author"
				? { type: "id", field: rest[0], value: rest.slice(1).join(" ") }
				: { type: "unknown", line };
		case "option":
			return parseOption(rest);
		case "info":
			return parseInfo(rest);
		case "bestmove":
			return rest[0]
				? {
						type: "bestmove",
						move: rest[0],
						ponder: rest[1] === "ponder" ? rest[2] : undefined,
					}
				: { type: "unknown", line };
		default:
			return { type: "unknown", line };
	}
}
