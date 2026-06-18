#!/usr/bin/env bash
# Build + unit-test the AgentPassportValidator contract in WSL.
# Runs offline against the embedded verifier WASM + a real proof.
set -euo pipefail
source "$HOME/.cargo/env"

WIN="/mnt/c/Users/usuario/OneDrive/Documentos/ZK STELLAR/open-stellar-passport"
SRC="$WIN/contracts/agent-passport-validator"
DST="$HOME/zk/agent-passport-validator"

echo "=== syncing crate to $DST (off the OneDrive fs) ==="
rm -rf "$DST"
mkdir -p "$DST/src"
cp "$SRC/Cargo.toml" "$DST/Cargo.toml"
cp "$SRC/verifier.wasm" "$DST/verifier.wasm"
cp "$SRC/src/lib.rs" "$DST/src/lib.rs"
cp "$SRC/src/test.rs" "$DST/src/test.rs"

cd "$DST"
export CARGO_TARGET_DIR="$HOME/zk/validator-target"

echo "=== cargo test (host) ==="
cargo test --color never 2>&1 | tail -40

echo "=== stellar contract build (wasm) ==="
stellar contract build 2>&1 | tail -20

WASM=$(find "$CARGO_TARGET_DIR" -name 'agent_passport_validator.wasm' -path '*release*' 2>/dev/null | head -1)
echo "built wasm: $WASM"
if [ -n "$WASM" ]; then
  mkdir -p "$WIN/contracts/validator-wasm"
  cp "$WASM" "$WIN/contracts/validator-wasm/agent_passport_validator.wasm"
  ls -la "$WIN/contracts/validator-wasm/"
  sha256sum "$WIN/contracts/validator-wasm/agent_passport_validator.wasm"
fi
echo "BUILD_VALIDATOR_DONE"
