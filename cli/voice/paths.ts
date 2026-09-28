import os from "node:os";
import path from "node:path";

const root = path.join(import.meta.dirname, "..", "..");

// ElevenLabs' responses as they came, before levelling. Kept in git so a change to `level.ts` is
// a rebuild (`npm run voice:level`) rather than a bill, and outside `public/` so they stay out of
// the build. They mirror `public/voice/` without its leading `voice/`.
export const RAW_DIR = path.join(root, "voice-raw");
const PUBLIC_DIR = path.join(root, "public");

// A clip's path is the one `clipPath` gives, `voice/<locale>/<id>/<remark>-<n>.mp3`.
export const rawFile = (clip: string) => path.join(RAW_DIR, path.relative("voice", clip));
export const publicFile = (clip: string) => path.join(PUBLIC_DIR, clip);

// Voice Design previews are listened to and thrown away, so they live outside the repo.
export const PREVIEW_DIR = path.join(os.homedir(), "Claude", "chess-animals", "voices");
