# Fails the build when any column of llvm-cov's TOTAL row falls under MIN percent. A column with
# nothing to count reads "-" and passes — a unit with no branches is not under-tested.
{ print }
$1 == "TOTAL" {
	for (i = 2; i <= NF; i++) {
		if ($i ~ /%$/ && $i + 0 < MIN) {
			low = 1
		}
	}
	found = 1
}
END {
	if (!found) {
		print "coverage: no TOTAL row in the llvm-cov report"
		exit 1
	}
	if (low) {
		printf "coverage: under the %d%% threshold\n", MIN
		exit 1
	}
}
