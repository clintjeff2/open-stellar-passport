#!/usr/bin/env bash
# Build the circom-groth16-verifier WASM with our circuit's VK baked in.
# Runs entirely in the Linux-native filesystem (fast), copies the WASM back to
# the Windows project dir.
set -euo pipefail
source "$HOME/.cargo/env"
export CARGO_NET_GIT_FETCH_WITH_CLI=true

WIN="/mnt/c/Users/usuario/OneDrive/Documentos/ZK STELLAR"
WORK="$HOME/zk"
mkdir -p "$WORK"
cd "$WORK"

if [ ! -d stellar-private-payments ]; then
  echo "Cloning Nethermind stellar-private-payments..."
  git clone --depth 1 https://github.com/NethermindEth/stellar-private-payments.git
fi

cp "$WIN/open-stellar-passport/build/verification_key.json" "$WORK/agent_vk.json"

cd stellar-private-payments
export VERIFIER_VK_JSON="$WORK/agent_vk.json"
echo "Building circom-groth16-verifier (VK = our agent_passport circuit)..."
stellar contract build --package circom-groth16-verifier --out-dir "$WORK/out"

echo "=== built artifacts ==="
ls -la "$WORK/out"
mkdir -p "$WIN/open-stellar-passport/contracts/verifier-wasm"
cp "$WORK/out/"*.wasm "$WIN/open-stellar-passport/contracts/verifier-wasm/"
echo "BUILD_OK"
