"use client";

/**
 * app/technical/page.tsx
 * DoBit Technical Specifications & Architecture.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Badge,
  Card,
  SectionHeading,
  Divider,
  PageHeader,
  Button,
  StatusDot,
} from "@/components/ui";

interface HealthResponse {
  ok: boolean;
  cluster: string;
  rpcUrl: string;
  currentSlot: number | null;
  rpcHealth: string | null;
  checkedAt: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Health check panel
// ---------------------------------------------------------------------------
function HealthPanel() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/health");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: HealthResponse = await r.json();
      setData(d);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <Card padding="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
            Devnet RPC Connectivity &amp; Slot Probe
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time server-side query to the Solana cluster via GET /api/health.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={run}
          isLoading={loading}
          icon={
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M13.5 2.5A7 7 0 1 1 3 11" />
              <path d="M13.5 2.5V7h-4.5" />
            </svg>
          }
        >
          Re-check RPC
        </Button>
      </div>

      {err && (
        <div className="p-3.5 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-xs text-[var(--accent-red)] font-mono mb-4">
          Error contacting health endpoint: {err}
        </div>
      )}

      {data && (
        <div className="mono-block space-y-0 text-xs">
          {[
            {
              k: "Cluster Status",
              v: data.ok ? "Connected & Healthy" : "Degraded",
              color: data.ok ? "var(--accent-green)" : "var(--accent-red)",
            },
            { k: "Solana Cluster", v: data.cluster, color: "#93C5FD" },
            { k: "RPC Endpoint", v: data.rpcUrl },
            {
              k: "Current Slot",
              v: data.currentSlot ? `#${data.currentSlot.toLocaleString()}` : "—",
              color: "var(--accent-green)",
            },
            {
              k: "RPC Health Score",
              v: data.rpcHealth ?? "—",
              color: data.rpcHealth === "ok" ? "var(--accent-green)" : "var(--accent-amber)",
            },
            { k: "Last Inspected", v: data.checkedAt },
            ...(data.error ? [{ k: "Error Details", v: data.error, color: "var(--accent-red)" }] : []),
          ].map(({ k, v, color }) => (
            <div key={k} className="data-row">
              <span className="data-row-key">{k}</span>
              <span className="data-row-value font-semibold" style={color ? { color } : undefined}>
                {v}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[var(--text-muted)] mt-3">
        Invokes <code className="code-tag">@solana/web3.js Connection.getSlot()</code> server-side. Zero private keys exposed.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Program IDs
// ---------------------------------------------------------------------------
const PROGRAMS = [
  { name: "Agent Registry (8004)", address: "6MuHv4dY4p9E4hSCEPr9dgbCSpMhq8x1vrUexbMVjfw1", net: "devnet" },
  { name: "ATOM Reputation Engine", address: "6Mu7qj6tRDrqchxJJPjr9V1H2XQjCerVKixFEEMwC1Tf", net: "devnet" },
  { name: "Agent Registry (8004) — Mainnet", address: "8oo4dC4JvBLwy5tGgiH3WwK4B9PWxL9Z4XjA2jzkQMbQ", net: "mainnet" },
  { name: "ATOM Engine — Mainnet", address: "AToMw53aiPQ8j7iHVb4fGt6nzUNxUhcPc3tbPBZuzVVb", net: "mainnet" },
];

function ProgramIds() {
  return (
    <Card padding="p-6">
      <SectionHeading>On-Chain Program Contracts</SectionHeading>
      <div className="space-y-3">
        {PROGRAMS.map((p) => (
          <div
            key={p.address}
            className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {p.name}
              </span>
              <Badge variant={p.net === "devnet" ? "amber" : "green"}>{p.net}</Badge>
            </div>
            <a
              href={`https://explorer.solana.com/address/${p.address}?cluster=${p.net === "devnet" ? "devnet" : "mainnet-beta"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link font-mono text-xs break-all block"
            >
              {p.address} ↗
            </a>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mt-3">
        Source: Official registry at{" "}
        <a href="https://8004.qnt.sh" target="_blank" rel="noopener noreferrer" className="link">
          8004.qnt.sh
        </a>
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// SDK info
// ---------------------------------------------------------------------------
function SdkInfo() {
  const rows = [
    { k: "Official SDK",     v: "8004-solana" },
    { k: "Current Version",  v: "0.8.5" },
    { k: "Node Requirement", v: ">=20.19.0 (tested on v22.12.0)" },
    { k: "Execution Mode",   v: "Full Stack (Next.js server-side transactions)" },
    { k: "Solana Primitives",v: "@solana/web3.js 1.99.0" },
    { k: "Devnet Indexer",   v: "8004-indexer-dev.qnt.sh (GraphQL)" },
    { k: "Standard",         v: "ERC-8004 Trustless Agents" },
  ];

  return (
    <Card padding="p-6">
      <SectionHeading>Verified Technology Stack</SectionHeading>
      <div className="mono-block space-y-0 text-xs mb-4">
        {rows.map(({ k, v }) => (
          <div key={k} className="data-row">
            <span className="data-row-key">{k}</span>
            <span className="data-row-value text-[var(--text-primary)]">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2.5">
        <a
          href="https://github.com/QuantuLabs/8004-solana-ts"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          SDK Repository ↗
        </a>
        <a
          href="https://8004.qnt.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          SDK Docs ↗
        </a>
        <a
          href="https://eips.ethereum.org/EIPS/eip-8004"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
        >
          ERC-8004 Standard ↗
        </a>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Architecture table
// ---------------------------------------------------------------------------
const ARCH_ROWS = [
  { action: "Agent registration (NFT mint)",  location: "Solana Devnet (Metaplex Core)",    onChain: true,  phase: 2 },
  { action: "Read agent identity & metadata", location: "8004-solana SDK → Devnet RPC",     onChain: true,  phase: 2 },
  { action: "Reputation score lookup (ATOM)", location: "8004-solana SDK → Devnet RPC",     onChain: true,  phase: 2 },
  { action: "Agent discovery via indexer",    location: "8004-indexer-dev.qnt.sh (GraphQL)", onChain: true,  phase: 2 },
  { action: "Post feedback after task",       location: "ATOM Program → Devnet",             onChain: true,  phase: 4 },
  { action: "ProofPass verified feedback",    location: "8004 Registry Program → Devnet",    onChain: true,  phase: 4 },
  { action: "Agent selection algorithm",      location: "Orchestrator Module (TypeScript)", onChain: false, phase: 3 },
  { action: "Task delegation (send prompt)",  location: "HTTP fetch to Agent Endpoint (A2A)",onChain: false, phase: 3 },
  { action: "Result validation heuristics",   location: "Orchestrator Module (TypeScript)", onChain: false, phase: 4 },
  { action: "Deterministic demo execution",   location: "In-process deterministic runtime",  onChain: false, phase: 3 },
];

function ArchTable() {
  return (
    <Card padding="p-6">
      <SectionHeading>On-Chain vs Application Logic Breakdown</SectionHeading>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Action / Functionality</th>
              <th>Execution Environment</th>
              <th>On-Chain?</th>
              <th>Phase</th>
            </tr>
          </thead>
          <tbody>
            {ARCH_ROWS.map((r) => (
              <tr key={r.action}>
                <td className="font-medium text-xs text-[var(--text-primary)]">{r.action}</td>
                <td className="font-mono text-xs text-[var(--text-secondary)]">{r.location}</td>
                <td>
                  {r.onChain ? (
                    <Badge variant="green">✓ On-Chain</Badge>
                  ) : (
                    <Badge variant="violet">App-Level</Badge>
                  )}
                </td>
                <td>
                  <Badge variant="muted">Phase {r.phase}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Implementation Roadmap
// ---------------------------------------------------------------------------
const PHASES = [
  {
    num: 1,
    title: "Scaffold & Connectivity",
    done: true,
    items: [
      "Next.js 15, React 19, TypeScript, Turbopack",
      "8004-solana SDK integration",
      "Server-side devnet RPC health probe (/api/health)",
      "Developer-grade dark theme design system",
    ],
  },
  {
    num: 2,
    title: "Agent Registration & On-Chain Identity",
    done: true,
    items: [
      "Coordinator agent registered on Solana Devnet",
      "Metaplex Core NFT minting and IPFS JSON metadata",
      "Live on-chain verification and asset query",
      "ATOM reputation seeding readiness",
    ],
  },
  {
    num: 3,
    title: "Task Delegation & Smart Agent Recommendation",
    done: true,
    items: [
      "Task Center dispatch workspace",
      "Orchestrator: capability matching + ATOM score ranking",
      "Deterministic simulated runtime & live A2A dispatch",
      "Real-time task execution feed",
    ],
  },
  {
    num: 4,
    title: "Validation & On-Chain ProofPass Feedback",
    done: false,
    items: [
      "Cryptographic response seal verification",
      "openProofPass() session PDA binding",
      "giveFeedbackWithProof() on-chain transaction loop",
      "Reputation score updates reflected dynamically",
    ],
  },
  {
    num: 5,
    title: "Production Polish & Ecosystem Integration",
    done: false,
    items: [
      "Phantom / Solflare browser wallet adapter",
      "Multi-agent collaborative pipelines",
      "Advanced analytics and historical charts",
    ],
  },
];

function Roadmap() {
  return (
    <Card padding="p-6">
      <SectionHeading>Engineering Roadmap &amp; Progress</SectionHeading>
      <div className="space-y-3.5">
        {PHASES.map((p) => (
          <div
            key={p.num}
            className={`p-4 rounded-xl border transition-all ${
              p.done
                ? "bg-[rgba(34,197,94,0.04)] border-[rgba(34,197,94,0.2)]"
                : "bg-[var(--bg-elevated)] border-[var(--border-default)]"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 font-mono ${
                  p.done
                    ? "bg-[rgba(34,197,94,0.15)] text-[var(--accent-green)] border border-[rgba(34,197,94,0.3)]"
                    : "bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border-default)]"
                }`}
              >
                {p.done ? "✓" : p.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Phase {p.num}: {p.title}
                  </h4>
                  <Badge variant={p.done ? "green" : "muted"}>
                    {p.done ? "Completed" : "In Progress"}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {p.items.map((item) => (
                    <li key={item} className="text-xs text-[var(--text-secondary)] list-disc ml-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TechnicalPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Technical Details"
        description="Verified on-chain contract addresses, SDK configuration, architecture specifications, and live devnet diagnostics."
        badge={<Badge variant="violet">Architecture</Badge>}
      />

      <div className="space-y-6">
        <HealthPanel />

        <div className="grid gap-6 lg:grid-cols-2">
          <ProgramIds />
          <SdkInfo />
        </div>

        <Divider />

        <ArchTable />
        <Roadmap />

        {/* Documentation links */}
        <Card padding="p-6">
          <SectionHeading>Official Documentation &amp; Protocols</SectionHeading>
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: "Solana Agent Registry", href: "https://solana.com/agent-registry" },
              { label: "ERC-8004 Specification", href: "https://eips.ethereum.org/EIPS/eip-8004" },
              { label: "8004-solana SDK", href: "https://github.com/QuantuLabs/8004-solana-ts" },
              { label: "8004 SDK Docs", href: "https://8004.qnt.sh" },
              { label: "Solana Explorer (Devnet)", href: "https://explorer.solana.com/?cluster=devnet" },
              { label: "Metaplex Core", href: "https://developers.metaplex.com/core" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
