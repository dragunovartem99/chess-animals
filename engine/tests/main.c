#include <stdio.h>

#include "api.h"
#include "harness.h"

static Test *tests;
static int failures;
static const char *current;

void harness_register(Test *test) {
	test->next = tests;
	tests = test;
}

void harness_fail(Failure failure) {
	failures++;
	(void)fprintf(stderr, "%s:%d: %s: CHECK(%s) failed\n", failure.file, failure.line, current,
	              failure.expr);
}

int main(void) {
	engine_init();
	int count = 0;
	for (Test *test = tests; test; test = test->next) {
		current = test->name;
		test->run();
		count++;
	}
	(void)printf("%d tests, %d failed checks\n", count, failures);
	return failures ? 1 : 0;
}
