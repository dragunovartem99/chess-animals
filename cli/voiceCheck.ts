import { CAST } from "./voice/casting";
import { eleven } from "./voice/eleven";

// `npm run voice:check` asks ElevenLabs for every voice in cli/voice/cast.yaml. A lookup is free,
// unlike a clip, so a library voice its owner took down shows here before `voice` pays for a run.

const failed = (
	await Promise.all(
		Object.entries(CAST).map(([id, { voice }]) =>
			eleven({ route: `/v1/voices/${voice}`, method: "GET" }).then(
				() => [],
				(error: Error) => [`${id}: ${error.message}`]
			)
		)
	)
).flat();

for (const message of failed) console.error(message);
if (failed.length > 0) process.exit(1);
console.log(`all ${Object.keys(CAST).length} voices are available`);
