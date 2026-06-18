#!/usr/bin/env bash
# Generate typed TypeScript bindings for the deployed AgentPassportValidator.
set -uo pipefail
source "$HOME/.cargo/env"

WIN="/mnt/c/Users/usuario/OneDrive/Documentos/ZK STELLAR/open-stellar-passport"
VID=$(tr -d '\r\n' < "$WIN/deploy/validator-contract-id.txt")
OUT="$WIN/sdk/bindings"

echo "=== generating bindings for $VID ==="
rm -rf "$OUT"
stellar contract bindings typescript \
  --network testnet \
  --id "$VID" \
  --output-dir "$OUT" \
  --overwrite 2>&1 | tail -15

echo "=== bindings tree ==="
find "$OUT" -maxdepth 2 -type f | sed "s#$OUT#sdk/bindings#"
echo "BINDINGS_DONE"
