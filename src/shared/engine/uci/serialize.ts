import type { UciCommand, UciResponse } from "./types";

export function serializeCommand(command: UciCommand): string {
	switch (command.type) {
		case "setoption":
			return `setoption name ${command.name}${command.value === undefined ? "" : ` value ${command.value}`}`;
		case "position": {
			const head =
				command.fen === undefined ? "position startpos" : `position fen ${command.fen}`;
			return command.moves.length === 0 ? head : `${head} moves ${command.moves.join(" ")}`;
		}
		case "go": {
			const parts = Object.entries(command.limits)
				.filter(([, value]) => value !== undefined)
				.map(([key, value]) => `${key} ${value}`);
			return ["go", ...parts].join(" ");
		}
		case "unknown":
			return command.line;
		default:
			return command.type;
	}
}

export function serializeResponse(response: UciResponse): string {
	switch (response.type) {
		case "id":
			return `id ${response.field} ${response.value}`;
		case "option": {
			const suffix = response.default === undefined ? "" : ` default ${response.default}`;
			return `option name ${response.name} type ${response.optionType}${suffix}`;
		}
		case "bestmove":
			return `bestmove ${response.move}${response.ponder ? ` ponder ${response.ponder}` : ""}`;
		case "info": {
			const parts: string[] = [];
			if (response.depth !== undefined) parts.push(`depth ${response.depth}`);
			if (response.score) {
				parts.push(
					response.score.kind === "cp"
						? `score cp ${response.score.value}`
						: `score mate ${response.score.moves}`
				);
			}
			if (response.nodes !== undefined) parts.push(`nodes ${response.nodes}`);
			if (response.pv) parts.push(`pv ${response.pv.join(" ")}`);
			return ["info", ...parts].join(" ");
		}
		case "unknown":
			return response.line;
		default:
			return response.type;
	}
}
