import { rmSync } from "node:fs";
import path from "node:path";

import { locales } from "@/locales";
import { MONSTERS, ROSTER, UNDERWATER } from "@/modules/bots/roster";

import { CAST, recast } from "./voice/casting";
import { describe } from "./voice/describe";
import { confirm, eleven } from "./voice/eleven";
import { PUBLIC_DIR } from "./voice/paths";
import { readPreviews } from "./voice/previews";

// `npm run voice:keep -- <id> <n>` saves preview <n> as the animal's voice and drops its clips. The
// old voice is deleted only on a yes, since every custom slot is taken.

const [id, n] = process.argv.slice(2);
const found = readPreviews(id).find((candidate) => candidate.n === Number(n));
if (!CAST[id] || !found)
	throw new Error(`no preview ${n} of ${id}: run npm run voice:design -- ${id}`);
const preview = found;

const rosters = { land: ROSTER, underwater: UNDERWATER, monsters: MONSTERS };
const roster = Object.entries(rosters).find(([, animals]) =>
	animals.some((animal) => animal.definition.id === id)
)?.[0];

const old = CAST[id].voice;
// Only a designed voice is ours to delete: a stock one is shared, and a library one is not in
// the account at all.
const { category } = (await (
	await eleven({ route: `/v1/voices/${old}`, method: "GET" })
).json()) as {
	category: string;
};
const designed = category === "generated";
let deleted = false;

async function drop() {
	if (!designed || deleted || !(await confirm(`Delete the old voice ${old} of ${id}?`))) return;
	await eleven({ route: `/v1/voices/${old}`, method: "DELETE" });
	deleted = true;
}

async function save(): Promise<string> {
	const response = await eleven({
		route: "/v1/text-to-voice",
		body: {
			voice_name: `chess-animals · ${roster} · ${id}`,
			voice_description: describe(CAST[id]),
			generated_voice_id: preview.generatedVoiceId,
		},
	});
	return ((await response.json()) as { voice_id: string }).voice_id;
}

// Saving first keeps the old voice if the save fails; when it fails for want of a slot, the old
// voice's slot is the one to free.
const voice = await save().catch(async (error: Error) => {
	console.error(error.message);
	await drop();
	if (!deleted) throw error;
	return save();
});
recast({ from: old, to: voice });
for (const locale of locales)
	rmSync(path.join(PUBLIC_DIR, "voice", locale, id), { recursive: true, force: true });
console.log(`${id} now speaks with ${voice}`);
await drop();
