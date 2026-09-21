import base from "@dragunovartem99/oxlint-config";

// The vendored Stockfish build is not ours to lint.
export default { ...base, ignorePatterns: [...(base.ignorePatterns ?? []), "public/stockfish/**"] };
