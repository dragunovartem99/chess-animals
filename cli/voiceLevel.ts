import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { RAW_DIR } from "./voice/paths";
import { publish } from "./voice/speak";

// `npm run voice:level` — rebuild every clip in `public/voice/` from its original in `voice-raw/`,
// with no call to ElevenLabs: the run after `level.ts` changes.

const originals = existsSync(RAW_DIR)
	? readdirSync(RAW_DIR, { recursive: true, encoding: "utf8" }).filter((file) =>
			file.endsWith(".mp3")
		)
	: [];
for (const file of originals) publish(path.join("voice", file));
console.log(`${originals.length} clips levelled`);
