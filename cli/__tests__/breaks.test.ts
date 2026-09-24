import { describe, expect, it } from "vitest";

import { withBreaks } from "../voice/breaks";

describe("withBreaks", () => {
	it("puts a beat between sentences", () => {
		expect(withBreaks("Oh. Hello? Sorry!")).toBe(
			'Oh. <break time="0.3s" /> Hello? <break time="0.3s" /> Sorry!'
		);
	});

	it("keeps an ellipsis whole and adds nothing after the last sentence", () => {
		expect(withBreaks("Mmm... hi.")).toBe('Mmm... <break time="0.3s" /> hi.');
	});

	it("leaves commas alone", () => {
		expect(withBreaks("Come in, come in")).toBe("Come in, come in");
	});
});
