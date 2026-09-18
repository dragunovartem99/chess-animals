# Two builds from one source tree: a freestanding wasm module for the app, and a hosted native
# test binary under ASan + UBSan + llvm-cov. `CC` is not used because make presets it to `cc`.
CLANG ?= clang
# Debian keeps clang-tidy, llvm-cov and friends beside clang in /usr/lib/llvm-N/bin, off PATH;
# asking the compiler finds the copies that match its version instead of whatever PATH holds.
tool = $(shell $(CLANG) -print-prog-name=$(1))
TIDY := $(call tool,clang-tidy)
FORMAT := $(call tool,clang-format)
PROFDATA := $(call tool,llvm-profdata)
COV := $(call tool,llvm-cov)
WASM_OPT ?= ../node_modules/.bin/wasm-opt

BUILD := build
SRC := $(shell find src -name '*.c')
TESTS := $(shell find tests -name '*.c')
BENCH := $(shell find bench -name '*.c')
HEADERS := $(shell find include src -name '*.h')
C_FILES := $(shell find include src tests bench -name '*.[ch]')

WARNINGS := -Wall -Wextra -Wpedantic -Wconversion -Wshadow -Werror
# No fused multiply-add: the features and the dot product must round exactly as the TS doubles do,
# and a contracted a * b + c rounds once where JavaScript rounds twice.
CFLAGS := -std=c17 $(WARNINGS) -ffp-contract=off -Iinclude
# -ffreestanding on the native build too, so the sources cannot lean on libc there and then
# fail to link in wasm, where there is none.
SRC_FLAGS := -ffreestanding
NATIVE_FLAGS := -O1 -g -fno-omit-frame-pointer -fsanitize=address,undefined \
	-fno-sanitize-recover=all -fprofile-instr-generate -fcoverage-mapping
# Bulk memory lowers the struct copies clang turns into memcpy calls to `memory.copy`, so the
# module needs no libc symbol to link.
# What the wasm build is optimised to, without the sanitizers that would make the numbers
# meaningless. The bench reads the roster through the test fixtures, so it sees `tests/`.
BENCH_FLAGS := -O3 -flto -Itests
# The stack is raised from wasm-ld's 64 KB: a node holds a move list and its priorities, a
# quiescence line runs to MAX_PLY, and overflowing it corrupts the statics below it silently.
WASM_FLAGS := --target=wasm32 -O3 -flto -nostdlib -mbulk-memory -Wl,--no-entry -Wl,--lto-O3 \
	-Wl,-z,stack-size=1048576

NATIVE_SRC_OBJ := $(SRC:%.c=$(BUILD)/native/%.o)
NATIVE_TEST_OBJ := $(TESTS:%.c=$(BUILD)/native/%.o)

.PHONY: all wasm test bench coverage format format-check lint clean
all: wasm test

wasm: $(BUILD)/engine.wasm

$(BUILD)/engine.wasm: $(SRC) $(HEADERS)
	@mkdir -p $(@D)
	$(CLANG) $(CFLAGS) $(SRC_FLAGS) $(WASM_FLAGS) $(SRC) -o $(BUILD)/engine.raw.wasm
	$(WASM_OPT) -O3 --strip-debug --strip-producers $(BUILD)/engine.raw.wasm -o $@

$(BUILD)/native/src/%.o: src/%.c
	@mkdir -p $(@D)
	$(CLANG) $(CFLAGS) $(SRC_FLAGS) $(NATIVE_FLAGS) -MMD -MP -c $< -o $@

$(BUILD)/native/tests/%.o: tests/%.c
	@mkdir -p $(@D)
	$(CLANG) $(CFLAGS) -Itests $(NATIVE_FLAGS) -MMD -MP -c $< -o $@

$(BUILD)/tests: $(NATIVE_SRC_OBJ) $(NATIVE_TEST_OBJ)
	$(CLANG) $(NATIVE_FLAGS) $^ -o $@

test: $(BUILD)/tests
	LLVM_PROFILE_FILE=$(BUILD)/tests.profraw ./$(BUILD)/tests

$(BUILD)/bench: $(SRC) $(BENCH) tests/corpus.c $(HEADERS) $(shell find bench tests -name '*.h')
	@mkdir -p $(@D)
	$(CLANG) $(CFLAGS) $(BENCH_FLAGS) $(SRC) $(BENCH) tests/corpus.c -o $@

bench: $(BUILD)/bench
	./$(BUILD)/bench

coverage: test
	$(PROFDATA) merge -sparse $(BUILD)/tests.profraw -o $(BUILD)/tests.profdata
	$(COV) report $(BUILD)/tests -instr-profile=$(BUILD)/tests.profdata src include \
		| awk -v MIN=90 -f scripts/coverage.awk

format:
	$(FORMAT) -i $(C_FILES)

format-check:
	$(FORMAT) --dry-run -Werror $(C_FILES)

# Tests are exempt from the line limit, as the TS specs are: a spec is a flat list of cases.
lint:
	$(TIDY) --quiet $(SRC) $(TESTS) $(BENCH) -- $(CFLAGS) -Itests
	awk -v MAX=100 -f scripts/max-lines.awk $(shell find include src -name '*.[ch]')

clean:
	rm -rf $(BUILD)

-include $(shell find $(BUILD) -name '*.d' 2>/dev/null)
