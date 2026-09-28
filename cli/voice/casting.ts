import { readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "yaml";

export type Cast = {
	voice: string;
	sounds: string;
	character: string;
	speaks: "he" | "she" | "we";
};

export const CAST: Record<string, Cast> = parse(
	readFileSync(path.join(import.meta.dirname, "cast.yaml"), "utf8")
);
