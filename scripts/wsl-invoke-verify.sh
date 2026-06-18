#!/usr/bin/env bash
# Invoke verify() on the deployed verifier with our real proof.
set -uo pipefail
source "$HOME/.cargo/env"

WIN="/mnt/c/Users/usuario/OneDrive/Documentos/ZK STELLAR/open-stellar-passport"
CID=$(tr -d '\r\n' < "$WIN/deploy/verifier-contract-id.txt")
PROOF=$(tr -d '\r\n' < "$WIN/build/arg_proof.json")
PUB=$(tr -d '\r\n' < "$WIN/build/arg_public.json")

echo "CONTRACT: $CID"
echo "Invoking verify() on-chain with the real proof..."
stellar contract invoke --id "$CID" --source passport-deployer --network testnet \
  -- verify --proof "$PROOF" --public_inputs "$PUB"
echo "INVOKE_DONE"
