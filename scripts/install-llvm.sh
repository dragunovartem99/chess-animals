#!/bin/sh
# Installs the LLVM major in .llvm-version from apt.llvm.org — clang, lld, clang-tidy, clang-format
# and the sanitizer runtimes. The engine's Makefile reads the same file. Pinned rather than the
# runner's clang: clang-format's output drifts between majors, and `format:check` must match local.
set -eu
LLVM=$(cat "$(dirname "$0")/../.llvm-version")
curl -fsSL https://apt.llvm.org/llvm-snapshot.gpg.key | sudo tee /etc/apt/keyrings/llvm.asc > /dev/null
codename=$(lsb_release -cs)
echo "deb [signed-by=/etc/apt/keyrings/llvm.asc] https://apt.llvm.org/$codename/ llvm-toolchain-$codename-$LLVM main" \
    | sudo tee /etc/apt/sources.list.d/llvm.list > /dev/null
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
    "clang-$LLVM" "lld-$LLVM" "llvm-$LLVM" "clang-tidy-$LLVM" "clang-format-$LLVM" "libclang-rt-$LLVM-dev"
