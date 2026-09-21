import type { BotConfig } from "../bots";
import type { UciResponse } from "../engine";

// What a caller may set on a sea animal beyond what every bot has: Stockfish's budget, and how
// often the animal is the one playing. The names are UCI's, `Mix` in percent.
export function describeSeaOptions(config: BotConfig): UciResponse[] {
	const { nodes, mix } = config.stockfish ?? { nodes: 0, mix: 0 };

	return [
		{ type: "option", name: "Nodes", optionType: "spin", default: String(nodes) },
		{ type: "option", name: "Mix", optionType: "spin", default: String(mix) },
	];
}

const LIMITS = {
	Nodes: { key: "nodes", min: 1, max: Infinity },
	Mix: { key: "mix", min: 0, max: 100 },
} as const;

// `undefined` for an option that is not the sea's, so the land engine underneath can have it; the
// config unchanged for one that is but has no usable value, because UCI says an engine ignores
// what it does not understand.
export function applySeaOption({
	config,
	name,
	value,
}: {
	config: BotConfig;
	name: string;
	value?: string;
}): BotConfig | undefined {
	const limit = LIMITS[name as keyof typeof LIMITS];
	if (!limit) return undefined;

	const number = Number(value);
	const usable = value !== undefined && number >= limit.min && number <= limit.max;
	if (!config.stockfish || !usable) return config;

	return { ...config, stockfish: { ...config.stockfish, [limit.key]: Math.floor(number) } };
}
