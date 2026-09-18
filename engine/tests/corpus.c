#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "corpus.h"
#include "harness.h"

// Copies the text up to `separator` into `field`, and returns what follows it.
static char *take_field(char *text, char separator, char *field, size_t size) {
	char *end = text == NULL ? NULL : strchr(text, separator);
	bool fits = end != NULL && (size_t)(end - text) < size;
	CHECK(fits);
	if (!fits) {
		return NULL;
	}
	memcpy(field, text, (size_t)(end - text));
	field[end - text] = '\0';
	return end + 1;
}

int corpus_each(void (*check)(const CorpusLine *line)) {
	FILE *file = fopen("tests/fixtures/moves.txt", "r");
	CHECK(file != NULL);
	if (file == NULL) {
		return 0;
	}
	static CorpusLine line;
	static char text[sizeof line + 32];
	int count = 0;
	while (fgets(text, sizeof text, file) != NULL) {
		char *rest = take_field(text, ';', line.before, sizeof line.before);
		rest = take_field(rest, ';', line.uci, sizeof line.uci);
		rest = take_field(rest, ';', line.after, sizeof line.after);
		rest = take_field(rest, ';', line.legal, sizeof line.legal);
		if (rest != NULL) {
			line.perft2 = strtoull(rest, NULL, 10);
			check(&line);
			count++;
		}
	}
	(void)fclose(file);
	return count;
}
