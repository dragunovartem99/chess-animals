#include <stdio.h>
#include <string.h>

#include "corpus.h"
#include "harness.h"
#include "move.h"
#include "position.h"

// Copies the text up to `separator` into `field`, and returns what follows it.
static char *take_field(char *text, char separator, char *field, size_t size) {
	char *end = strchr(text, separator);
	CHECK(end != NULL && (size_t)(end - text) < size);
	if (end == NULL || (size_t)(end - text) >= size) {
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
	int count = 0;
	char text[FEN_MAX * 2 + UCI_MAX + 4];
	while (fgets(text, sizeof text, file) != NULL) {
		CorpusLine line;
		char *rest = take_field(text, ';', line.before, sizeof line.before);
		rest = rest ? take_field(rest, ';', line.uci, sizeof line.uci) : NULL;
		rest = rest ? take_field(rest, '\n', line.after, sizeof line.after) : NULL;
		if (rest != NULL) {
			check(&line);
			count++;
		}
	}
	(void)fclose(file);
	return count;
}
