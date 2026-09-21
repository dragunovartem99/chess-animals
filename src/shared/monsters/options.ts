import type { BotConfig } from "../bots";
import type { UciResponse } from "../engine";

// What a caller may set on a monster beyond what every bot has: Stockfish's budget, how many
// lines it weighs, and how carelessly it picks among them. `Temperature` is in centipawns.
export function describeMonsterOptions(config: BotConfig): UciResponse[] {
	const { nodes, lines, temperature } = config.stockfish ?? {
		nodes: 0,
		lines: 0,
		temperature: 0,
	};

	return [
		{ type: "option", name: "Nodes", optionType: "spin", default: String(nodes) },
		{ type: "option", name: "Lines", optionType: "spin", default: String(lines) },
		{ type: "option", name: "Temperature", optionType: "spin", default: String(temperature) },
	];
}

const LIMITS = {
	Nodes: { key: "nodes", min: 1, max: Infinity },
	// Stockfish's own ceiling on MultiPV.
	Lines: { key: "lines", min: 1, max: 500 },
	Temperature: { key: "temperature", min: 0, max: Infinity },
} as const;

// `undefined` for an option that is not a monster's, so the land engine underneath can have it; the
// config unchanged for one that is but has no usable value, because UCI says an engine ignores
// what it does not understand.
export function applyMonsterOption({
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
