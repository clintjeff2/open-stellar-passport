#!/usr/bin/env bash
# Deploy the verifier WASM to Stellar testnet and dump its interface.
set -uo pipefail
source "$HOME/.cargo/env"

WIN="/mnt/c/Users/usuario/OneDrive/Documentos/ZK STELLAR"
WASM="$HOME/zk/out/circom_groth16_verifier.wasm"
OUTDIR="$WIN/open-stellar-passport/deploy"
mkdir -p "$OUTDIR"

# Identity (generate + fund via friendbot if not present)
if ! stellar keys address passport-deployer >/dev/null 2>&1; then
  echo "Generating + funding testnet identity..."
  stellar keys generate passport-deployer --network testnet --fund
fi
ADDR=$(stellar keys address passport-deployer)
echo "DEPLOYER: $ADDR"
echo "$ADDR" > "$OUTDIR/deployer.txt"

echo "Deploying verifier WASM to testnet..."
CID=$(stellar contract deploy --wasm "$WASM" --source passport-deployer --network testnet)
echo "CONTRACT_ID: $CID"
echo "$CID" > "$OUTDIR/verifier-contract-id.txt"

echo "=== INTERFACE ==="
stellar contract info interface --id "$CID" --network testnet 2>&1 | head -60
echo "DEPLOY_OK"
