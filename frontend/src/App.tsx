import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PassportCard, type PassportState } from "./components/PassportCard";
import { Badge, Button, Card, Dot, Mono, cx } from "./components/ui";
import {
  authorizePayment,
  CONTRACTS,
  mintPassport,
  replaySpentProof,
  verifyOnChain,
  type MintedProof,
  type OnChainResult,
} from "./lib/passport";

const EXPLORER = (id: string) => `https://stellar.expert/explorer/testnet/contract/${id}`;
const REPO = "https://github.com/leocagli/open-stellar-passport";
const toStroops = (xlm: number) => BigInt(Math.round(xlm * 1e7)).toString();

interface PayResult {
  authorized: boolean;
  reason: string;
  amount: number;
}

export default function App() {
  const [minted, setMinted] = useState<MintedProof | null>(null);
  const [proving, setProving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyRes, setVerifyRes] = useState<OnChainResult | null>(null);
  const [cap, setCap] = useState(50);
  const [payRes, setPayRes] = useState<PayResult | null>(null);
  const [paying, setPaying] = useState(false);
  const [replay, setReplay] = useState<OnChainResult | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) => setLog((l) => [...l, `${new Date().toLocaleTimeString()}  ${line}`]);

  const cardState: PassportState = verifyRes?.ok
    ? "verified"
    : minted
      ? "proven"
      : proving
        ? "proving"
        : "empty";

  async function doMint() {
    setProving(true);
    setMinted(null);
    setVerifyRes(null);
    setPayRes(null);
    addLog(`→ generating witness + Groth16 proof client-side (cap ${cap} XLM)…`);
    try {
      const m = await mintPassport(toStroops(cap));
      setMinted(m);
      addLog(`✓ proof generated in ${m.provingMs} ms · off-chain verify: ${m.offChainValid}`);
      addLog(`  agentId #${m.agentId} · nullifier ${m.nullifierHash.slice(0, 18)}…`);
    } catch (e) {
      addLog(`✗ proving failed: ${String((e as Error).message)}`);
    } finally {
      setProving(false);
    }
  }

  async function doVerify() {
    if (!minted) return;
    setVerifying(true);
    addLog(`→ submitting proof to AgentPassportValidator (BN254 pairing on-chain)…`);
    const r = await verifyOnChain(minted);
    setVerifyRes(r);
    addLog(r.ok ? `✓ ON-CHAIN VERIFIED · attestation minted (ledger ${r.attestation?.ledger})` : `✗ rejected: ${r.error}`);
    setVerifying(false);
  }

  async function doPay(amount: number) {
    if (!minted) return;
    setPaying(true);
    addLog(`→ agent #${minted.agentId} requests payment of ${amount} XLM (x402 gate)…`);
    const r = await authorizePayment(minted.agentId, toStroops(amount));
    setPayRes({ authorized: r.authorized, reason: r.reason, amount });
    addLog(r.authorized ? `✓ APPROVED — ${r.reason}` : `⛔ DENIED — ${r.reason}`);
    setPaying(false);
  }

  async function doReplay() {
    setReplaying(true);
    addLog(`→ replaying a previously-spent passport (agent #42)…`);
    const r = await replaySpentProof();
    setReplay(r);
    addLog(r.ok ? `! unexpectedly accepted` : `✓ chain rejected replay — ${r.error}`);
    setReplaying(false);
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <Hero />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_minmax(360px,420px)]">
          {/* LEFT — the guided flow */}
          <div className="space-y-5">
            <Step
              n={1}
              title="Mint a passport"
              desc="Pick a spend cap. Your owner secret + balance are generated and proven here — they never leave the browser."
              active={!minted}
              done={!!minted}
            >
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex-1 min-w-[200px]">
                  <span className="mb-1.5 block text-xs text-muted">Spend cap</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={500}
                      step={5}
                      value={cap}
                      onChange={(e) => setCap(Number(e.target.value))}
                      className="w-full accent-[var(--color-violet)]"
                    />
                    <span className="w-24 text-right font-mono text-sm text-cyan">{cap} XLM</span>
                  </div>
                </label>
                <Button onClick={doMint} loading={proving}>
                  {proving ? "Proving…" : minted ? "Re-generate proof" : "Generate proof"}
                </Button>
              </div>

              <AnimatePresence>
                {minted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="rounded-xl border border-white/8 bg-ink-900/60 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge tone="cyan">
                          <Dot tone="cyan" /> Groth16 proof · {minted.provingMs} ms
                        </Badge>
                        <Badge tone={minted.offChainValid ? "verified" : "denied"}>
                          off-chain verify: {String(minted.offChainValid)}
                        </Badge>
                      </div>
                      <div className="grid gap-1.5">
                        <Mono label="π.a" value={minted.proofHex.a} />
                        <Mono label="π.b" value={minted.proofHex.b} />
                        <Mono label="π.c" value={minted.proofHex.c} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            <Step
              n={2}
              title="Verify on-chain"
              desc="The Soroban validator runs the BN254 pairing check, then mints a zk-passport attestation — live, no wallet needed (read-only simulation)."
              active={!!minted && !verifyRes?.ok}
              done={!!verifyRes?.ok}
              locked={!minted}
            >
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={doVerify} loading={verifying} disabled={!minted}>
                  {verifyRes?.ok ? "Verified ✓" : "Verify on Stellar"}
                </Button>
                <a
                  href={EXPLORER(CONTRACTS.validator)}
                  target="_blank"
                  className="text-xs text-muted underline-offset-4 hover:text-cyan hover:underline"
                >
                  validator contract ↗
                </a>
              </div>
              <AnimatePresence>
                {verifyRes && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    {verifyRes.ok ? (
                      <div className="rounded-xl border border-verified/20 bg-verified/5 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-verified">
                          ✓ Attestation minted on-chain
                        </div>
                        <div className="mt-2 grid gap-1.5">
                          <Mono label="nullifier" value={verifyRes.attestation!.nullifier} />
                          <Mono label="registry root" value={verifyRes.attestation!.registry_root} />
                          <div className="font-mono text-xs text-muted">
                            ledger <span className="text-fg">{verifyRes.attestation!.ledger}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-denied/20 bg-denied/5 p-4 text-sm text-denied">
                        ✗ {verifyRes.error}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            <Step
              n={3}
              title="Agent pays (x402 gate)"
              desc="A payment settles only if the agent holds a passport whose proven — but hidden — cap covers the amount."
              active={!!verifyRes?.ok}
              locked={!verifyRes?.ok}
            >
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => doPay(Math.round(cap * 0.7))} loading={paying} disabled={!verifyRes?.ok}>
                  Pay {Math.round(cap * 0.7)} XLM (within cap)
                </Button>
                <Button variant="outline" onClick={() => doPay(Math.round(cap * 1.4))} loading={paying} disabled={!verifyRes?.ok}>
                  Pay {Math.round(cap * 1.4)} XLM (over cap)
                </Button>
              </div>
              <AnimatePresence>
                {payRes && (
                  <motion.div
                    key={`${payRes.amount}-${payRes.authorized}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cx(
                      "mt-4 flex items-center gap-3 rounded-xl border p-4",
                      payRes.authorized ? "border-verified/25 bg-verified/5" : "border-denied/25 bg-denied/5",
                    )}
                  >
                    <span className="text-2xl">{payRes.authorized ? "✅" : "⛔"}</span>
                    <div>
                      <div className={cx("text-sm font-semibold", payRes.authorized ? "text-verified" : "text-denied")}>
                        {payRes.authorized ? "Payment authorized" : "Payment denied"} · {payRes.amount} XLM
                      </div>
                      <div className="text-xs text-muted">{payRes.reason} — balance never revealed.</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            <Step
              n={4}
              title="Anti-replay (anti-Sybil)"
              desc="Each passport burns a one-time nullifier. Replaying a spent proof is rejected by the chain."
              subtle
            >
              <Button variant="danger" onClick={doReplay} loading={replaying}>
                Replay a spent passport
              </Button>
              <AnimatePresence>
                {replay && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                    <Badge tone={replay.ok ? "denied" : "verified"}>
                      {replay.ok ? "unexpectedly accepted" : `chain rejected · ${replay.error}`}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>
          </div>

          {/* RIGHT — passport + console */}
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <PassportCard
              state={cardState}
              agentId={minted?.agentId}
              spendCap={minted?.spendCap}
              nullifier={minted?.nullifierHash}
              registryRoot={minted?.registryRoot}
              ledger={verifyRes?.attestation?.ledger}
            />
            <Console lines={log} />
          </div>
        </div>

        <ClaimGrid />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/6 bg-ink-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <img src="/passport.svg" width={26} height={26} alt="" />
          <span className="font-semibold tracking-tight">Agent Passport</span>
          <Badge tone="violet" className="ml-1 hidden sm:inline-flex">
            <Dot tone="violet" /> testnet
          </Badge>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <a href={EXPLORER(CONTRACTS.validator)} target="_blank" className="hidden px-3 py-1.5 text-muted hover:text-fg sm:block">
            Contract
          </a>
          <a
            href={REPO}
            target="_blank"
            className="rounded-lg border border-white/12 px-3 py-1.5 text-fg/90 transition-colors hover:border-white/25 hover:bg-white/5"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-14 text-center">
      <Badge tone="cyan" className="mx-auto">
        <Dot tone="cyan" /> Stellar Hacks · Real-World ZK
      </Badge>
      <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
        Let AI agents pay — <span className="text-gradient">without doxxing their owner</span> or exposing their balance.
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-balance text-muted">
        A single zero-knowledge proof, verified on-chain in Soroban, attests an agent is backed by a verified human,
        is Sybil-resistant, and is solvent for its spend cap — revealing none of it.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Badge tone="violet">🧍 personhood · Merkle membership</Badge>
        <Badge tone="cyan">🔒 anti-Sybil · nullifier</Badge>
        <Badge tone="verified">💰 proof-of-funds · balance hidden</Badge>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  desc,
  children,
  active,
  done,
  locked,
  subtle,
}: {
  n: number;
  title: string;
  desc: string;
  children: ReactNode;
  active?: boolean;
  done?: boolean;
  locked?: boolean;
  subtle?: boolean;
}) {
  return (
    <Card
      className={cx(
        "transition-all duration-300",
        locked && "opacity-50",
        active && "ring-1 ring-violet/30 shadow-[0_0_40px_-20px_rgba(124,92,255,0.8)]",
      )}
    >
      <div className="flex gap-4">
        <div
          className={cx(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ring-1 ring-inset",
            done
              ? "bg-verified/15 text-verified ring-verified/40"
              : subtle
                ? "bg-white/5 text-faint ring-white/10"
                : "bg-violet/15 text-violet-soft ring-violet/40",
          )}
        >
          {done ? "✓" : n}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-sm text-muted">{desc}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </Card>
  );
}

function Console({ lines }: { lines: string[] }) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-denied/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-verified/60" />
        </div>
        <span className="font-mono text-xs text-faint">proof console</span>
      </div>
      <div className="h-44 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
        {lines.length === 0 ? (
          <span className="text-faint">// waiting — mint a passport to begin</span>
        ) : (
          lines.map((l, i) => (
            <div
              key={i}
              className={cx(
                "whitespace-pre-wrap",
                l.includes("✓") ? "text-verified" : l.includes("✗") || l.includes("⛔") ? "text-denied" : "text-muted",
              )}
            >
              {l}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function ClaimGrid() {
  const items = [
    { t: "Identity loss", d: "No KYC honeypot. Personhood is a Merkle membership proof — no PII ever touches the chain.", e: "🧍" },
    { t: "Money loss", d: "A compromised agent can't exceed its proven spend cap. Keys & full balance stay with the owner.", e: "💸" },
    { t: "Sybil farms", d: "A Poseidon2 nullifier binds one identity to one agent. Replays are rejected on-chain.", e: "🔒" },
  ];
  return (
    <section className="mt-16">
      <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-faint">What it stops</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {items.map((i) => (
          <Card key={i.t} className="text-center">
            <div className="text-3xl">{i.e}</div>
            <div className="mt-3 font-semibold">{i.t}</div>
            <p className="mt-1.5 text-sm text-muted">{i.d}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 text-center text-xs text-faint">
        <div>
          Reuses{" "}
          <a className="hover:text-muted" href="https://github.com/NethermindEth/stellar-private-payments" target="_blank">
            Nethermind's circom-groth16-verifier
          </a>{" "}
          · targets{" "}
          <a className="hover:text-muted" href="https://github.com/trionlabs/stellar-8004" target="_blank">
            stellar-8004
          </a>{" "}
          agent identity.
        </div>
        <div>Research prototype · not audited · testnet only.</div>
      </div>
    </footer>
  );
}
