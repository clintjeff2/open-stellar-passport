# Agent Passport — demo

A live, single-page demo of the Agent Passport flow. **Real client-side ZK
proving** (snarkjs/WASM) and **real on-chain verification** against the deployed
Soroban validator — nothing is mocked.

## The flow

1. **Mint a passport** — pick a spend cap; a fresh owner secret + balance are
   generated and a Groth16 proof is produced *in the browser* (~1 s). Secrets
   never leave the page.
2. **Verify on-chain** — the proof is sent to `AgentPassportValidator`, which
   runs the BN254 pairing check and mints a `zk-passport` attestation. Done as a
   read-only simulation, so no wallet is needed to demo it live.
3. **Agent pays (x402 gate)** — a payment is authorized only if the agent's
   proven (but hidden) spend cap covers the amount.
4. **Anti-replay** — replaying a previously-spent proof is rejected on-chain
   with `NullifierUsed`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

The circuit artifacts (`public/zk/*.wasm`, `*.zkey`) are produced by the repo's
Phase 0 build and committed so the demo runs out of the box.

## Stack

Vite + React 19 + TypeScript, Tailwind v4, framer-motion. On-chain calls use
`@stellar/stellar-sdk` via typed bindings generated from the deployed contract
(`src/lib/validatorClient.ts`). The full pipeline lives in
[`src/lib/passport.ts`](src/lib/passport.ts).

Design system: [`../design-system/`](../design-system/) (also published to
Claude Design).

Contracts (testnet):
- validator `CDNSZUNEWFCGSPWLPDSWTENR2WPHKC34RGZQG7RJA54OPGTZGVVRFYBA`
- verifier `CCMKLYSRUH2HMA4UU6WLXWQXEY6KAH5AWB5BEVMJGNGC5GLGTVROLG4A`
