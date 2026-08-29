import { describe, expect, it } from "vitest";

import { parseCommand } from "../parseCommand";
import { parseResponse } from "../parseResponse";
import { serializeCommand, serializeResponse } from "../serialize";
import type { UciCommand, UciResponse } from "../types";

const COMMANDS: UciCommand[] = [
	{ type: "uci" },
	{ type: "isready" },
	{ type: "ucinewgame" },
	{ type: "stop" },
	{ type: "quit" },
	{ type: "setoption", name: "swarm" },
	{ type: "setoption", name: "Skill Level", value: "12" },
	{ type: "position", moves: [] },
	{ type: "position", moves: ["e2e4", "e7e5"] },
	{ type: "position", fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", moves: ["e1e2"] },
	{ type: "go", limits: {} },
	{ type: "go", limits: { depth: 3 } },
	{ type: "go", limits: { depth: 3, nodes: 1000, movetime: 50 } },
];

const RESPONSES: UciResponse[] = [
	{ type: "uciok" },
	{ type: "readyok" },
	{ type: "id", field: "name", value: "Swarm Wolf" },
	{ type: "id", field: "author", value: "chess-animals" },
	{ type: "option", name: "swarm", optionType: "string", default: "-12" },
	{ type: "bestmove", move: "e2e4" },
	{ type: "bestmove", move: "e2e4", ponder: "e7e5" },
	{ type: "info", depth: 2, nodes: 400, score: { kind: "cp", value: -35 }, pv: ["e2e4", "e7e5"] },
	{ type: "info", depth: 1, nodes: 20, score: { kind: "mate", moves: 1 }, pv: ["a1a8"] },
];

describe("commands", () => {
	it.each(COMMANDS)("round-trips $type", (command) => {
		expect(parseCommand(serializeCommand(command))).toEqual(command);
	});
});

describe("responses", () => {
	it.each(RESPONSES)("round-trips $type", (response) => {
		expect(parseResponse(serializeResponse(response))).toEqual(response);
	});
});

describe("parseCommand", () => {
	it("keeps an option name that contains spaces whole", () => {
		expect(parseCommand("setoption name Skill Level value 12")).toEqual({
			type: "setoption",
			name: "Skill Level",
			value: "12",
		});
	});

	it("reads a negative, fractional weight, which is what a tuned bot is made of", () => {
		expect(parseCommand("setoption name swarm value -12.5")).toEqual({
			type: "setoption",
			name: "swarm",
			value: "-12.5",
		});
	});

	it("treats startpos as the absence of a FEN", () => {
		expect(parseCommand("position startpos")).toEqual({ type: "position", moves: [] });
	});

	it("keeps all six FEN fields together, spaces and all", () => {
		const command = parseCommand("position fen 4k3/8/8/8/8/8/8/4K3 w - - 0 1 moves e1e2");

		expect(command).toEqual({
			type: "position",
			fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
			moves: ["e1e2"],
		});
	});

	it("ignores limits it does not know rather than failing", () => {
		expect(parseCommand("go wtime 300000 btime 300000 depth 4")).toEqual({
			type: "go",
			limits: { depth: 4 },
		});
	});

	it("reports an unknown line instead of throwing, as the protocol requires", () => {
		expect(parseCommand("debug on")).toEqual({ type: "unknown", line: "debug on" });
	});

	it("tolerates ragged whitespace", () => {
		expect(parseCommand("  go   depth   2  ")).toEqual({ type: "go", limits: { depth: 2 } });
	});
});
