#include "api.h"
#include "harness.h"

TEST(reports_the_abi_version) { CHECK(abi_version() == ENGINE_ABI_VERSION); }
