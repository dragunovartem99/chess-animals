import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { PREVIEW_DIR } from "./paths";

// What saving a preview as a voice needs, and the seed that designed it, so a preview that is
// nearly right can be designed again from a tweaked prompt.
export type Preview = { n: number; generatedVoiceId: string; seed: number };

const manifest = (id: string) => path.join(PREVIEW_DIR, `${id}.json`);

export const previewFile = ({ id, n }: { id: string; n: number }) =>
	path.join(PREVIEW_DIR, `${id}-${n}.mp3`);

export function readPreviews(id: string): Preview[] {
	return existsSync(manifest(id)) ? JSON.parse(readFileSync(manifest(id), "utf8")) : [];
}

export function writePreviews({ id, previews }: { id: string; previews: Preview[] }) {
	writeFileSync(manifest(id), `${JSON.stringify(previews, null, "\t")}\n`);
}
