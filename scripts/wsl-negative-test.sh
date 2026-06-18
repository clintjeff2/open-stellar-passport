#!/usr/bin/env bash
# Soundness check: a tampered public input must make verification FAIL.
set -uo pipefail
source "$HOME/.cargo/env"

WIN="/mnt/c/Users/usuario/OneDrive/Documentos/ZK STELLAR/open-stellar-passport"
CID=$(tr -d '\r\n' < "$WIN/deploy/verifier-contract-id.txt")
PROOF=$(tr -d '\r\n' < "$WIN/build/arg_proof.json")

# Real public inputs were [registryRoot, nullifierHash, 42, 500000000].
# Tamper the 4th (spendCap -> 999999999); the proof no longer matches.
BAD='["3068829097279014190258251168411223843893512111345273305725860278806736175050","19392402810396889502969648830299378881527752671441005095350228344288591481620","42","999999999"]'

echo "=== verify() with TAMPERED spendCap (expect failure / error) ==="
stellar contract invoke --id "$CID" --source passport-deployer --network testnet \
  -- verify --proof "$PROOF" --public_inputs "$BAD" 2>&1 | tail -10
echo "NEG_DONE"
