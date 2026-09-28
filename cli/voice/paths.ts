import os from "node:os";
import path from "node:path";

// A clip's path is the one `clipPath` gives, `voice/<locale>/<id>/<remark>-<n>.mp3`.
export const PUBLIC_DIR = path.join(import.meta.dirname, "..", "..", "public");
export const publicFile = (clip: string) => path.join(PUBLIC_DIR, clip);

// Voice Design previews are listened to and thrown away, so they live outside the repo.
export const PREVIEW_DIR = path.join(os.homedir(), "Claude", "chess-animals", "voices");
