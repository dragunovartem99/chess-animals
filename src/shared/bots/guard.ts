import { FEATURES_BY_KEY } from "../eval";
import type { BotDefinition, Phase } from "./types";

const PHASES: Phase[] = ["opening", "middlegame", "endgame"];

const ID_PATTERN = /^[a-z][a-z0-9-]*$/u;

function fail({ id, problem }: { id: unknown; problem: string }): never {
	throw new Error(`invalid bot "${typeof id === "string" ? id : "?"}": ${problem}`);
}

function checkWeights({ id, phase, record }: { id: string; phase: string; record: unknown }): void {
	if (typeof record !== "object" || record === null)
		fail({ id, problem: `${phase} weights are not an object` });

	for (const [key, value] of Object.entries(record as Record<string, unknown>)) {
		if (!FEATURES_BY_KEY.has(key))
			fail({ id, problem: `${phase} names unknown feature "${key}"` });
		if (typeof value !== "number" || !Number.isFinite(value)) {
			fail({ id, problem: `${phase} weight "${key}" is not a finite number` });
		}
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

	if (typeof candidate.temperature !== "number" || candidate.temperature < 0) {
		fail({ id, problem: "temperature must be zero or more" });
	}

	const weights = candidate.weights as Record<string, unknown> | undefined;
	if (!weights || typeof weights.middlegame !== "object") {
		fail({ id, problem: "weights.middlegame is required — the other phases fall back to it" });
	}

	for (const phase of PHASES) {
		if (weights[phase] !== undefined) checkWeights({ id, phase, record: weights[phase] });
	}
}

export function isBotDefinition(value: unknown): value is BotDefinition {
	try {
		assertBotDefinition(value);
		return true;
	} catch {
		return false;
	}
}
