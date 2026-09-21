import { FEATURES_BY_KEY } from "../eval";
import { BASES } from "./bases";
import type { BotDefinition } from "./types";

const ID_PATTERN = /^[a-z][a-z0-9-]*$/u;

function fail({ id, problem }: { id: unknown; problem: string }): never {
	throw new Error(`invalid bot "${typeof id === "string" ? id : "?"}": ${problem}`);
}

function checkWeights({ id, record }: { id: string; record: unknown }): void {
	if (typeof record !== "object" || record === null)
		fail({ id, problem: "weights are not an object" });

	for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
		if (!FEATURES_BY_KEY.has(key)) fail({ id, problem: `unknown feature "${key}"` });
		if (typeof value !== "number" || !Number.isFinite(value)) {
			fail({ id, problem: `weight "${key}" is not a finite number` });
		}
	}
}

function checkStockfish({ id, stockfish }: { id: string; stockfish: unknown }): void {
	if (stockfish === undefined) return;

	const options = (
		typeof stockfish === "object" && stockfish !== null ? stockfish : {}
	) as Record<string, unknown>;
	if (!Number.isInteger(options.nodes) || (options.nodes as number) < 1) {
		fail({ id, problem: "stockfish.nodes must be a whole number of at least 1" });
	}

	const { mix } = options;
	if (typeof mix !== "number" || !(mix >= 0 && mix <= 100)) {
		fail({ id, problem: "stockfish.mix must be a percentage from 0 to 100" });
	}
}

// Bots arrive from files a person edited, from the weight editor, from a tuner run, and from
// localStorage written by an older version of this app. None of those are trustworthy, and a bot
// that is quietly wrong plays a whole tournament before anyone notices, so it is rejected loudly
// at the door instead.
export function assertBotDefinition(value: unknown): asserts value is BotDefinition {
	if (typeof value !== "object" || value === null)
		fail({ id: undefined, problem: "not an object" });

	const candidate = value as Record<string, unknown>;
	const { id } = candidate;

	if (typeof id !== "string" || !ID_PATTERN.test(id)) {
		fail({ id, problem: "id must be lower-case letters, digits and dashes" });
	}

	const search = candidate.search as Record<string, unknown> | undefined;
	if (!search || !Number.isInteger(search.depth) || (search.depth as number) < 1) {
		fail({ id, problem: "search.depth must be a whole number of at least 1" });
	}

	const { base } = candidate;
	if (base !== undefined && (typeof base !== "string" || !(base in BASES))) {
		fail({ id, problem: `unknown base "${String(base)}"` });
	}

	checkStockfish({ id, stockfish: candidate.stockfish });
	checkWeights({ id, record: candidate.weights });
}

export function isBotDefinition(value: unknown): value is BotDefinition {
	try {
		assertBotDefinition(value);
		return true;
	} catch {
		return false;
	}
}
