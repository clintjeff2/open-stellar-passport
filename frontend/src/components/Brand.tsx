import type { SVGProps } from "react";

const YELLOW = "#fdda24";

/**
 * Agent Passport mark — a shield (trust / verified credential) holding a
 * four-point spark (Stellar). Shield renders in currentColor; spark in `accent`.
 * `ticks` is accepted for backwards-compat and ignored.
 */
export function Mark({
  accent = YELLOW,
  ticks: _ticks,
  ...props
}: SVGProps<SVGSVGElement> & { accent?: string; ticks?: boolean }) {
  void _ticks;
  return (
    <svg viewBox="0 0 32 32" width={24} height={24} fill="none" {...props}>
      <path
        d="M16 4 L25 7.5 V14 C25 19.5 21.4 23.3 16 25 C10.6 23.3 7 19.5 7 14 V7.5 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 10C16.4 13.4 18.1 15.1 21.5 15.5C18.1 15.9 16.4 17.6 16 21C15.6 17.6 13.9 15.9 10.5 15.5C13.9 15.1 15.6 13.4 16 10Z"
        fill={accent}
      />
    </svg>
  );
}

/** Mark on a solid black chip — the app icon lockup. */
export function MarkChip({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: "#0a0a0a",
        color: "#ffffff",
      }}
    >
      <Mark width={size * 0.66} height={size * 0.66} />
    </span>
  );
}

/** Full wordmark: chip + "Agent Passport". */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <MarkChip size={30} />
      <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: 15 }}>Agent Passport</span>
        <span style={{ fontSize: 9.5, letterSpacing: "0.22em", color: "var(--color-faint)", fontFamily: "var(--font-mono)", marginTop: 3 }}>
          ZK · STELLAR
        </span>
      </span>
    </span>
  );
}

/** Large faint mark for section/hero backdrops. */
export function MarkWatermark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Mark
      className={className}
      style={{ color: "#0a0a0a", ...style }}
      accent={YELLOW}
      width={520}
      height={520}
    />
  );
}
