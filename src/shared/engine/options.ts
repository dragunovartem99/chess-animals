import type { BotConfig } from "../bots";
import { FEATURES_BY_KEY, type WeightVector } from "../eval";
import type { UciResponse } from "./uci/types";

// Engine options are advertised the usual way. Weights are not: there are sixty-odd of them, and
// listing them in answer to `uci` would drown the useful ones. They are still settable by their
// feature key — `setoption name swarm value -180` — and the registry is the list of what may be
// named, which the tuner reads directly.
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

// Copied rather than written in place: a config is treated as immutable everywhere else, and a
// live search holds the vector it was built with.
function withWeight({
	weights,
	id,
	value,
}: {
	weights: WeightVector;
	id: number;
	value: number;
}): WeightVector {
	const next = Float32Array.from(weights);
	next[id] = value;

	return next;
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
			// Zero is the protocol's way of saying "no limit", so it clears one — but a value
			// that is not a number at all is ignored like every other option's, rather than
			// quietly turning the budget off.
			if (!usable || number < 0) return config;

			return {
				...config,
				search: {
					...config.search,
					nodeLimit: number >= 1 ? Math.floor(number) : undefined,
				},
			};
		default:
			break;
	}

	const feature = FEATURES_BY_KEY.get(name);
	if (!feature || !usable) return config;

	return {
		...config,
		weights: withWeight({ weights: config.weights, id: feature.id, value: number }),
	};
}
