# The C side of oxlint's `max-lines`: at most MAX lines of real code per file, blank lines and
# comments excluded, so a file's own explanations never eat into its budget.
FNR == 1 {
	check()
	file = FILENAME
	count = 0
	block = 0
}
{
	line = $0
	if (block) {
		if (!sub(/.*\*\//, "", line)) {
			next
		}
		block = 0
	}
	gsub(/\/\*([^*]|\*+[^*\/])*\*+\//, "", line)
	if (match(line, /\/\*/)) {
		line = substr(line, 1, RSTART - 1)
		block = 1
	}
	sub(/\/\/.*/, "", line)
	if (line ~ /[^ \t]/) {
		count++
	}
}
END {
	check()
	exit failed
}
function check() {
	if (file != "" && count > MAX) {
		printf "%s: %d lines of code, max %d\n", file, count, MAX
		failed = 1
	}
}
