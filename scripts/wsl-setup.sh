#!/usr/bin/env bash
# Idempotent WSL toolchain setup + verification for open-stellar-passport.
set -uo pipefail

source "$HOME/.cargo/env" 2>/dev/null || true

if ! command -v rustup >/dev/null 2>&1; then
  echo "Installing rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | \
    sh -s -- -y --default-toolchain stable --profile minimal
  source "$HOME/.cargo/env"
fi

echo "Adding wasm targets..."
rustup target add wasm32v1-none wasm32-unknown-unknown >/dev/null 2>&1

echo "=== RESULTS ==="
echo "RUSTC:   $(rustc --version 2>&1)"
echo "CARGO:   $(cargo --version 2>&1)"
echo "STELLAR: $(stellar --version 2>&1 | head -1)"
echo "TARGETS: $(rustup target list --installed 2>&1 | grep wasm | tr '\n' ' ')"
if command -v rustc >/dev/null 2>&1 && command -v stellar >/dev/null 2>&1; then
  echo "SETUP_OK"
else
  echo "SETUP_INCOMPLETE"
fi
