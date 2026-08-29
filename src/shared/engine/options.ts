import type { BotConfig, Phase } from "../bots";
import { FEATURES_BY_KEY, type PhaseWeights } from "../eval";
import type { UciResponse } from "./uci/types";

const PHASES: Phase[] = ["opening", "middlegame", "endgame"];

// Engine options are advertised the usual way. Weights are not: there are sixty-odd features and
// three phases, and listing two hundred lines in answer to `uci` would drown the useful ones.
// They are still settable by name — `middlegame.swarm`, or `all.swarm` for every phase — and the
// feature registry is the list of what may be named, which the tuner reads directly.
export function describeOptions(config: BotConfig): UciResponse[] {
	return [
		{ type: "option", name: "Depth", optionType: "spin", default: String(config.search.depth) },
		{
			type: "option",
			name: "Temperature",
			optionType: "string",
			default: String(config.temperature),
		},
		{
			type: "option",
			name: "Quiescence",
			optionType: "check",
			default: String(config.search.quiescence ?? false),
		},
		{
			type: "option",
			name: "NodeLimit",
			optionType: "spin",
			default: String(config.search.nodeLimit ?? 0),
		},
		// The seed is the engine's, not the bot's: two workers running the same animal must be
		// able to differ, and the same seed must replay exactly.
		{ type: "option", name: "Seed", optionType: "string", default: config.id },
	];
}

function withWeight({
	weights,
	phases,
	id,
	value,
}: {
	weights: PhaseWeights;
	phases: Phase[];
	id: number;
	value: number;
}): PhaseWeights {
	const next = { ...weights };

	for (const phase of phases) {
		const copy = Float32Array.from(next[phase]);
		copy[id] = value;
		next[phase] = copy;
	}

	return next;
}

// `<phase>.<feature>`, or `all.<feature>` for every phase at once. Anything else is not a weight.
function parseWeightName(name: string): { phases: Phase[]; id: number } | undefined {
	const [scope, key] = name.split(".");
	const feature = key === undefined ? undefined : FEATURES_BY_KEY.get(key);
	if (!feature) return undefined;

	if (scope === "all") return { phases: PHASES, id: feature.id };

	return PHASES.includes(scope as Phase)
		? { phases: [scope as Phase], id: feature.id }
		: undefined;
}

// Applies one `setoption` to a config, returning a new one. Values arrive as strings — UCI has no
// other kind — and anything unparseable leaves the config untouched, because the protocol says an
// engine ignores what it does not understand rather than falling over.
export function applyOption({
	config,
	name,
	value,
}: {
	config: BotConfig;
	name: string;
	value?: string;
}): BotConfig {
	const number = Number(value);
	const usable = value !== undefined && Number.isFinite(number);

	switch (name) {
		case "Depth":
			return usable && number >= 1
				? { ...config, search: { ...config.search, depth: Math.floor(number) } }
				: config;
		case "Temperature":
			return usable && number >= 0 ? { ...config, temperature: number } : config;
		case "Quiescence":
			return { ...config, search: { ...config.search, quiescence: value === "true" } };
		case "NodeLimit":
			return usable && number > 0
				? { ...config, search: { ...config.search, nodeLimit: Math.floor(number) } }
				: { ...config, search: { ...config.search, nodeLimit: undefined } };
		default:
			break;
	}

	const weight = parseWeightName(name);
	if (!weight || !usable) return config;

	return {
		...config,
		weights: withWeight({ weights: config.weights, ...weight, value: number }),
	};
}
