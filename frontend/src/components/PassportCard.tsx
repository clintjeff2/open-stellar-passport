import { motion } from "framer-motion";
import { Badge, Dot, shorten } from "./ui";

export type PassportState = "empty" | "proving" | "proven" | "verified";

interface Props {
  state: PassportState;
  agentId?: string;
  spendCap?: string;
  nullifier?: string;
  registryRoot?: string;
  ledger?: number;
}

const fmtCap = (raw?: string) => {
  if (!raw) return "•••••••";
  // display as XLM-ish stroops (7 decimals) for relatability
  const n = Number(BigInt(raw)) / 1e7;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`;
};

export function PassportCard({ state, agentId, spendCap, nullifier, registryRoot, ledger }: Props) {
  const sealed = state === "verified";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.6rem] p-[1px]"
      style={{ background: "linear-gradient(140deg, rgba(124,92,255,.5), rgba(34,211,238,.35) 45%, rgba(124,92,255,.15))" }}
    >
      <div className="relative holo animate-sheen overflow-hidden rounded-[1.55rem] bg-ink-850/90 p-6">
        {/* watermark grid */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
              <svg width="16" height="16" viewBox="0 0 32 32" className="opacity-80">
                <rect x="5" y="3" width="22" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="16" cy="13" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9.5 23c1.4-3 4-4.4 6.5-4.4S21.1 20 22.5 23" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Agent Passport
            </div>
            <div className="mt-1 font-mono text-[11px] text-faint">zk-credential · BN254</div>
          </div>

          {state === "empty" && <Badge tone="muted"><Dot tone="muted" /> Not minted</Badge>}
          {state === "proving" && <Badge tone="violet"><Dot tone="violet" /> Proving…</Badge>}
          {state === "proven" && <Badge tone="cyan"><Dot tone="cyan" /> Proof ready</Badge>}
          {sealed && (
            <Badge tone="verified" className="animate-pulse-ring">
              <Dot tone="verified" /> Verified on-chain
            </Badge>
          )}
        </div>

        {/* identity row — deliberately redacted */}
        <div className="relative mt-7 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet/30 to-cyan/20 ring-1 ring-white/10">
            <span className="text-2xl">🛂</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-faint">Holder identity</div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="select-none tracking-widest text-muted">████████</span>
              <Badge tone="violet">hidden by ZK</Badge>
            </div>
            <div className="mt-0.5 text-xs text-faint">balance ████████ · proven ≥ cap</div>
          </div>
        </div>

        {/* data grid */}
        <div className="relative mt-6 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-xs">
          <Field label="Agent ID" value={agentId ? `#${agentId}` : "—"} />
          <Field label="Spend cap" value={fmtCap(spendCap)} highlight />
          <Field label="Nullifier" value={nullifier ? shorten(nullifier, 8, 6) : "—"} />
          <Field label="Registry root" value={registryRoot ? shorten(registryRoot, 8, 6) : "—"} />
        </div>

        <div className="relative mt-6 flex items-center justify-between border-t border-white/8 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
            {sealed ? `sealed · ledger ${ledger ?? "—"}` : "stellar testnet"}
          </span>
          <span
            className={`grid h-9 w-9 place-items-center rounded-full text-sm transition-all ${
              sealed ? "bg-verified/15 text-verified ring-1 ring-verified/40" : "bg-white/5 text-faint ring-1 ring-white/10"
            }`}
          >
            {sealed ? "✓" : "○"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className={highlight ? "text-cyan" : "text-fg/90"}>{value}</div>
    </div>
  );
}
