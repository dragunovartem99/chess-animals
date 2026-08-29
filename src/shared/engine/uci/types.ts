// The slice of UCI this project speaks. It is deliberately small: enough for one process to ask
// another for a move, and exactly what `stockfish.wasm` already answers to, so a real engine can
// be dropped in behind the same interface without the arena knowing.

export type GoLimits = {
	depth?: number;
	nodes?: number;
	movetime?: number;
};

// Sent by whatever is asking for a move.
export type UciCommand =
	| { type: "uci" }
	| { type: "isready" }
	| { type: "ucinewgame" }
	| { type: "setoption"; name: string; value?: string }
	| { type: "position"; fen?: string; moves: string[] }
	| { type: "go"; limits: GoLimits }
	| { type: "stop" }
	| { type: "quit" }
	// UCI tells an engine to ignore what it does not understand rather than fail, so an unknown
	// line is a value here, not an error.
	| { type: "unknown"; line: string };

export type ScoreValue = { kind: "cp"; value: number } | { kind: "mate"; moves: number };

// Sent by whatever is playing.
export type UciResponse =
	| { type: "id"; field: "name" | "author"; value: string }
	| { type: "option"; name: string; optionType: string; default?: string }
	| { type: "uciok" }
	| { type: "readyok" }
	| { type: "info"; depth?: number; nodes?: number; score?: ScoreValue; pv?: string[] }
	| { type: "bestmove"; move: string; ponder?: string }
	| { type: "unknown"; line: string };
