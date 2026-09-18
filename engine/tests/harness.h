#ifndef ENGINE_TESTS_HARNESS_H
#define ENGINE_TESTS_HARNESS_H

typedef struct Test {
	const char *name;
	void (*run)(void);
	struct Test *next;
} Test;

typedef struct {
	const char *file;
	int line;
	const char *expr;
} Failure;

void harness_register(Test *test);
void harness_fail(Failure failure);

// Each TEST links itself in from a constructor, so a new spec file needs no line in a central
// list — the way vitest finds a spec by its name. The nodes are static: no allocation, no cap.
#define TEST(fn)                                                                                   \
	static void fn(void);                                                                          \
	static Test test_##fn = {.name = #fn, .run = (fn)};                                            \
	__attribute__((constructor)) static void register_##fn(void) { harness_register(&test_##fn); } \
	static void fn(void)

#define CHECK(cond)                                                                                \
	((cond) ? (void)0 : harness_fail((Failure){.file = __FILE__, .line = __LINE__, .expr = #cond}))

#endif
