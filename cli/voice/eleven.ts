import { createInterface } from "node:readline/promises";

const key = process.env.ELEVENLABS_API_KEY;

// One ElevenLabs call. Throws on a refusal with its body, since that names the reason (quota,
// a missing permission, an expired preview) better than the status does.
export async function eleven({
	route,
	method = "POST",
	body,
}: {
	route: string;
	method?: string;
	body?: unknown;
}): Promise<Response> {
	if (!key) throw new Error("ELEVENLABS_API_KEY is not set: put it in .env.local");
	const response = await fetch(`https://api.elevenlabs.io${route}`, {
		method,
		headers: { "xi-api-key": key, "content-type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	if (!response.ok)
		throw new Error(`${method} ${route}: ${response.status} ${await response.text()}`);
	return response;
}

// A yes/no on stdin, for whatever costs money or cannot be undone. Anything but "y" is a no.
export async function confirm(question: string): Promise<boolean> {
	const prompt = createInterface({ input: process.stdin, output: process.stdout });
	const answer = await prompt.question(`${question} [y/N] `);
	prompt.close();
	return answer.trim().toLowerCase() === "y";
}
