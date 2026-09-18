import { describe, expect, it } from "vitest";

import { isHeaderCurrent } from "../featuresHeader";

// The C engine numbers its feature slots from the committed header. A registry entry appended
// without regenerating it would leave C writing one feature into another's slot.
describe("engine/include/feature_ids.h", () => {
	it("matches the feature registry — run `npm run engine:features` if not", () => {
		expect(isHeaderCurrent()).toBe(true);
	});
});
