import base from "@dragunovartem99/oxfmt-config";

// Someone else's minified build, pinned byte for byte: reformatting it would make the vendored
// file no longer the release it says it is.
export default { ...base, ignorePatterns: ["public/stockfish/**"] };
