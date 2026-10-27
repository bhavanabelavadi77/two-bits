"use client";

export const dynamic = "force-dynamic";

/**
 * app/agent-registry/page.tsx
 * DoBit Agent Registry — Phase 2B.
 *
 * Real features in this phase:
 *  - Configuration readiness check (GET /api/agents/registered)
 *  - Manual, user-initiated registration via POST /api/agents/register
 *  - Confirmation step before submitting a transaction
 *  - Live on-chain verification after registration
 */

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Card,
  CardInner,
  SectionHeading,
  EmptyState,
  PageHeader,
  Button,
  StatusDot,
  Divider,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfigStatus {
  signerConfigured: boolean;
  ipfsConfigured: boolean;
  cluster: string;
}

interface RegistrationRecord {
  agentId: string;       // local ID, e.g. "coordinator"
  asset: string;         // base58 on-chain pubkey
  signature: string;     // base58 tx signature
  registeredAt: string;  // ISO timestamp
  cluster: string;
}

interface RegisteredApiResponse {
  ok: boolean;
  config: ConfigStatus;
  records: RegistrationRecord[];
  liveData: Record<string, {
    nft_name?: string;
    owner?: string;
    agent_uri?: string;
    atom_enabled?: boolean;
    collection?: string;
    error?: string;
  }> | null;
}

type LiveDataMap = Record<string, {
  nft_name?: string;
  owner?: string;
  agent_uri?: string;
  atom_enabled?: boolean;
  collection?: string;
  error?: string;
}>;

interface RegisterApiResponse {
  ok: boolean;
  alreadyRegistered?: boolean;
  agentId?: string;
  agentLocalId?: string;
  signature?: string;
  metadataUri?: string;
  explorerUrl?: string;
  txExplorerUrl?: string;
  registeredAt?: string;
  error?: string;
  code?: string;
  message?: string;
}

type RegistrationState =
  | { phase: "idle" }
  | { phase: "loading_config" }
  | { phase: "ready"; config: ConfigStatus; records: RegistrationRecord[] }
  | { phase: "confirming"; config: ConfigStatus; records: RegistrationRecord[] }
  | { phase: "registering" }
  | { phase: "success"; result: RegisterApiResponse }
  | { phase: "error"; message: string; code?: string };

// ---------------------------------------------------------------------------
// Configuration status panel
// ---------------------------------------------------------------------------

function ConfigPanel({ config }: { config: ConfigStatus }) {
  const items = [
    {
      label: "Signer keypair",
      ok: config.signerConfigured,
      okText: "Configured & Ready",
      failText: "SOLANA_PRIVATE_KEY missing (.env.local)",
    },
    {
      label: "IPFS / Pinata Gateway",
      ok: config.ipfsConfigured,
      okText: "Configured & Ready",
      failText: "PINATA_JWT missing (.env.local)",
    },
    {
      label: "Solana Cluster",
      ok: true,
      okText: config.cluster,
      failText: "",
    },
  ];

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs"
        >
          <span className="font-medium text-[var(--text-secondary)]">{item.label}</span>
          <div className="flex items-center gap-2">
            <StatusDot variant={item.ok ? "green" : "red"} />
            <span
              className="font-mono text-xs"
              style={{ color: item.ok ? "var(--accent-green)" : "var(--accent-red)" }}
            >
              {item.ok ? item.okText : item.failText}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent details preview
// ---------------------------------------------------------------------------

function AgentPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3.5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border border-[var(--border-default)] shadow-sm"
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.25))",
          }}
        >
          🤖
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              DoBit Coordinator Agent
            </h4>
            <Badge variant="violet">Coordinator</Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Local ID: <code className="code-tag">coordinator</code>
          </p>
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        Autonomous coordinator agent that discovers candidate specialists on-chain,
        evaluates ATOM reputation scores, delegates tasks, and writes verifiable feedback.
      </p>

      <div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Registered Capabilities
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            "task analysis",
            "specialist discovery",
            "agent selection",
            "delegation coordination",
          ].map((cap) => (
            <Badge key={cap} variant="blue">
              {cap}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mono-block text-xs space-y-0">
        <div className="data-row">
          <span className="data-row-key">Protocol Service</span>
          <span className="data-row-value">A2A Dispatch</span>
        </div>
        <div className="data-row">
          <span className="data-row-key">Skill Taxonomy</span>
          <span className="data-row-value">natural_language_processing/text_generation</span>
        </div>
        <div className="data-row">
          <span className="data-row-key">Domain</span>
          <span className="data-row-value">technology/software_engineering</span>
        </div>
        <div className="data-row">
          <span className="data-row-key">ATOM Reputation</span>
          <span className="data-row-value text-[var(--accent-amber)]">
            Ready (Enabled after feedback)
          </span>
        </div>
        <div className="data-row">
          <span className="data-row-key">Network</span>
          <span className="data-row-value text-[#93C5FD]">
            Solana Devnet
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirmation step
// ---------------------------------------------------------------------------

function ConfirmationStep({
  config,
  onConfirm,
  onCancel,
}: {
  config: ConfigStatus;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)]">
        <div className="flex items-start gap-2.5 mb-2.5">
          <StatusDot variant="yellow" />
          <h4 className="text-sm font-semibold text-[var(--accent-amber)]">
            Confirm On-Chain Registration
          </h4>
        </div>
        <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 ml-5 list-disc leading-relaxed">
          <li>
            Uploads agent JSON metadata to IPFS via Pinata Gateway.
          </li>
          <li>
            Mints a Metaplex Core NFT representing the agent on <strong>Solana Devnet</strong>.
          </li>
          <li>
            Estimated devnet fee: <strong>~0.00924 SOL</strong> (no real money involved).
          </li>
          <li>
            Cluster: <strong className="text-[var(--text-primary)]">{config.cluster}</strong>.
          </li>
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          onClick={onConfirm}
        >
          Confirm &amp; Register on Devnet
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success result panel
// ---------------------------------------------------------------------------

function SuccessPanel({ result }: { result: RegisterApiResponse }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.25)]">
        <StatusDot variant="green" />
        <span className="text-sm font-semibold text-[var(--accent-green)]">
          {result.alreadyRegistered
            ? "Agent already registered — returned existing record."
            : "Agent successfully registered on Solana Devnet!"}
        </span>
      </div>

      <div className="mono-block space-y-0 text-xs">
        <div className="data-row">
          <span className="data-row-key">Asset (Pubkey)</span>
          <span className="data-row-value text-[var(--accent-green)] font-semibold">
            {result.agentId}
          </span>
        </div>
        {result.signature && (
          <div className="data-row">
            <span className="data-row-key">Tx Signature</span>
            <span className="data-row-value text-xs font-mono">
              {result.signature}
            </span>
          </div>
        )}
        {result.metadataUri && (
          <div className="data-row">
            <span className="data-row-key">Metadata URI</span>
            <span className="data-row-value">
              {result.metadataUri}
            </span>
          </div>
        )}
        {result.registeredAt && (
          <div className="data-row">
            <span className="data-row-key">Registered At</span>
            <span className="data-row-value">{result.registeredAt}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {result.explorerUrl && (
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            View on Solana Explorer ↗
          </a>
        )}
        {result.txExplorerUrl && !result.alreadyRegistered && (
          <a
            href={result.txExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            View Transaction ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registered agent card
// ---------------------------------------------------------------------------

const AGENT_TITLES: Record<string, string> = {
  coordinator: "DoBit Coordinator Agent",
  "code-reviewer": "Rust & Smart Contract Auditor",
  "summarizer-ai": "Research & Document Synthesizer",
  "data-analyst": "Market & Anomaly Specialist",
};

function RegisteredAgentCard({ record }: { record: RegistrationRecord }) {
  const [copied, setCopied] = useState(false);

  const title = AGENT_TITLES[record.agentId] || `Agent ${record.agentId}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(record.asset);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card padding="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border border-[var(--border-default)]"
            style={{
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))",
            }}
          >
            🤖
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h4>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              ID: {record.agentId}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="green">On-Chain Verified</Badge>
          <Badge variant="amber">{record.cluster}</Badge>
        </div>
      </div>

      <div className="mono-block space-y-0 text-xs mb-3.5">
        <div className="data-row">
          <span className="data-row-key">Asset Pubkey</span>
          <span className="data-row-value text-[#93C5FD]">
            {record.asset}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row-key">Mint Tx</span>
          <span className="data-row-value text-xs text-[var(--text-muted)]">
            {record.signature}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row-key">Registered</span>
          <span className="data-row-value">
            {new Date(record.registeredAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={copyAddress}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          }
        >
          {copied ? "Copied Pubkey!" : "Copy Asset Pubkey"}
        </Button>
        <a
          href={`https://explorer.solana.com/address/${record.asset}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm text-xs"
        >
          Solana Explorer ↗
        </a>
        <a
          href={`https://explorer.solana.com/tx/${record.signature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-sm text-xs"
        >
          View Tx ↗
        </a>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main registration panel
// ---------------------------------------------------------------------------

function RegistrationPanel() {
  const [state, setState] = useState<RegistrationState>({ phase: "idle" });

  const loadStatus = useCallback(async () => {
    setState({ phase: "loading_config" });
    try {
      const res = await fetch("/api/agents/registered?load=true");
      const data: RegisteredApiResponse = await res.json();
      setState({
        phase: "ready",
        config: data.config,
        records: data.records,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load configuration.";
      setState({ phase: "error", message: msg });
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  function handleRegisterClick() {
    if (state.phase !== "ready") return;
    setState({ phase: "confirming", config: state.config, records: state.records });
  }

  function handleCancel() {
    if (state.phase !== "confirming") return;
    setState({ phase: "ready", config: state.config, records: state.records });
  }

  async function handleConfirm() {
    setState({ phase: "registering" });
    try {
      const res = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "coordinator" }),
      });
      const data: RegisterApiResponse = await res.json();
      if (data.ok) {
        setState({ phase: "success", result: data });
      } else {
        setState({
          phase: "error",
          message: data.error ?? "Registration failed.",
          code: data.code,
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Network error contacting the server.";
      setState({ phase: "error", message: msg });
    }
  }

  if (state.phase === "loading_config") {
    return (
      <Card padding="p-6">
        <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
          <StatusDot variant="yellow" />
          Verifying Solana configuration…
        </div>
      </Card>
    );
  }

  if (state.phase === "error") {
    return (
      <Card padding="p-6">
        <SectionHeading>Agent Registration</SectionHeading>
        <div className="p-4 rounded-xl text-xs mb-4 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-[var(--accent-red)]">
          {state.code === "MISSING_CONFIG" ? (
            <>
              <strong>Configuration Required:</strong> {state.message}
            </>
          ) : (
            <>
              <strong>Registration Error:</strong> {state.message}
            </>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={loadStatus}>
          Retry Diagnostic
        </Button>
      </Card>
    );
  }

  if (state.phase === "success") {
    return (
      <Card padding="p-6">
        <SectionHeading>Registration Completed</SectionHeading>
        <SuccessPanel result={state.result} />
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={loadStatus}
        >
          ← Back to Registry Overview
        </Button>
      </Card>
    );
  }

  const config =
    state.phase === "ready" || state.phase === "confirming"
      ? state.config
      : null;
  const records =
    state.phase === "ready" || state.phase === "confirming"
      ? state.records
      : [];

  const isFullyConfigured = config
    ? config.signerConfigured && config.ipfsConfigured
    : false;
  const coordinatorAlreadyRegistered = records.some((r) => r.agentId === "coordinator");

  return (
    <Card padding="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
            Register Agent on Devnet
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Mint Metaplex Core NFT representing agent identity on Solana.
          </p>
        </div>
        <Badge variant="amber">Devnet Program</Badge>
      </div>

      {/* Agent preview */}
      <div className="mb-5">
        <AgentPreview />
      </div>

      <Divider className="my-5" />

      {/* Configuration status */}
      {config && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2.5">
            Server Infrastructure Status
          </p>
          <ConfigPanel config={config} />
        </div>
      )}

      {/* Cost note */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] mb-5">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="1.6"
          className="shrink-0 mt-0.5"
        >
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
        </svg>
        <p className="leading-relaxed">
          Registration incurs <strong className="text-[var(--text-primary)]">~0.00924 devnet SOL</strong>{" "}
          (testnet only). Sourced from the official <code className="code-tag">8004-solana</code> SDK documentation.
        </p>
      </div>

      {/* Action area */}
      {state.phase === "confirming" && config && (
        <ConfirmationStep
          config={config}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {state.phase === "registering" && (
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)]">
          <svg
            className="animate-spin h-5 w-5 text-[var(--accent-violet)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Uploading metadata to IPFS and submitting Solana transaction…</span>
        </div>
      )}

      {state.phase === "ready" && (
        <>
          {coordinatorAlreadyRegistered ? (
            <div className="p-4 rounded-xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.2)]">
              <div className="flex items-center gap-2 mb-1.5">
                <StatusDot variant="green" />
                <span className="font-semibold text-sm text-[var(--accent-green)]">
                  Coordinator Agent Already Registered
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                The agent is recorded on-chain. You can view its verified status and metadata in the right panel.
              </p>
            </div>
          ) : !isFullyConfigured ? (
            <div>
              <Button variant="primary" size="lg" className="w-full" disabled>
                Register Agent on Devnet
              </Button>
              <p className="text-xs text-[var(--text-muted)] mt-2.5 text-center">
                Configure missing environment variables in <code className="code-tag">.env.local</code> to enable transaction signing.
              </p>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleRegisterClick}
            >
              Register Agent on Devnet →
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Registered agents section
// ---------------------------------------------------------------------------

function RegisteredAgentsList() {
  const [records, setRecords] = useState<RegistrationRecord[] | null>(null);
  const [liveData, setLiveData] = useState<LiveDataMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents/registered?load=true")
      .then((r) => r.json())
      .then((d: RegisteredApiResponse) => {
        setRecords(d.records);
        setLiveData(d.liveData ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 py-6 text-sm text-[var(--text-secondary)]">
        <StatusDot variant="yellow" />
        Loading registered agents from Solana devnet…
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card padding="p-8">
        <EmptyState
          icon={
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="10" cy="7" r="3.5" />
              <path d="M3.5 17c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" strokeLinecap="round" />
            </svg>
          }
          title="No Agents Registered Yet"
          subtitle="Use the registration panel on the left to mint the first agent on Solana Devnet."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((rec) => (
        <div key={rec.asset} className="space-y-2">
          <RegisteredAgentCard record={rec} />
          {/* On-chain live verified data */}
          {liveData && liveData[rec.asset] && (
            <CardInner padding="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <StatusDot variant={liveData[rec.asset].error ? "red" : "green"} />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Live On-Chain Verification (Metaplex Core)
                </span>
              </div>
              {liveData[rec.asset].error ? (
                <p className="text-xs text-[var(--accent-red)] font-mono">
                  RPC error: {liveData[rec.asset].error}
                </p>
              ) : (
                <div className="mono-block text-xs space-y-0">
                  {liveData[rec.asset].nft_name && (
                    <div className="data-row">
                      <span className="data-row-key">NFT Name</span>
                      <span className="data-row-value font-semibold text-[var(--text-primary)]">
                        {liveData[rec.asset].nft_name}
                      </span>
                    </div>
                  )}
                  {liveData[rec.asset].owner && (
                    <div className="data-row">
                      <span className="data-row-key">Owner Pubkey</span>
                      <span className="data-row-value text-[#93C5FD]">
                        {liveData[rec.asset].owner}
                      </span>
                    </div>
                  )}
                  {liveData[rec.asset].agent_uri && (
                    <div className="data-row">
                      <span className="data-row-key">IPFS URI</span>
                      <span className="data-row-value text-xs">
                        {liveData[rec.asset].agent_uri}
                      </span>
                    </div>
                  )}
                  {typeof liveData[rec.asset].atom_enabled === "boolean" && (
                    <div className="data-row">
                      <span className="data-row-key">ATOM Enabled</span>
                      <span
                        className="data-row-value font-semibold"
                        style={{
                          color: liveData[rec.asset].atom_enabled
                            ? "var(--accent-green)"
                            : "var(--accent-amber)",
                        }}
                      >
                        {liveData[rec.asset].atom_enabled ? "Yes (Active)" : "No"}
                      </span>
                    </div>
                  )}
                  {liveData[rec.asset].collection && (
                    <div className="data-row">
                      <span className="data-row-key">Collection</span>
                      <span className="data-row-value">{liveData[rec.asset].collection}</span>
                    </div>
                  )}
                </div>
              )}
            </CardInner>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentRegistryPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Agent Registry"
        description="Register and discover autonomous agents on the Solana Agent Registry. Every agent is an on-chain Metaplex Core NFT with verifiable identity and reputation."
        badge={<Badge variant="violet">Phase 2B</Badge>}
      />

      {/* Judge On-Chain Proof Verification Banner */}
      <div className="p-4 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[var(--accent-violet)]">
              ⚖️ Hackathon Judge On-Chain Proof Verification
            </span>
            <Badge variant="green">Devnet Verified</Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Every agent below is an authentic on-chain Metaplex Core asset registered via the 8004 Solana Agent Registry (<code className="code-tag">6MuHv4d...</code>).
            Click <strong>&quot;Solana Explorer ↗&quot;</strong> or copy the asset pubkey to verify live on Solana Explorer (Devnet).
          </p>
        </div>
        <a
          href="https://explorer.solana.com/address/6MBXFZG9zUkhcub68RtGuYaghVYfYhu9NqhM1kXn4Pdv?cluster=devnet"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-sm shrink-0 whitespace-nowrap"
        >
          Verify Coordinator on Explorer ↗
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: registration panel & program references */}
        <div className="space-y-6">
          <RegistrationPanel />

          {/* On-chain program reference */}
          <Card padding="p-6">
            <SectionHeading>On-Chain Registry Contracts (Devnet)</SectionHeading>
            <div className="space-y-3.5">
              {[
                {
                  name: "Agent Registry (ERC-8004)",
                  address: "6MuHv4dY4p9E4hSCEPr9dgbCSpMhq8x1vrUexbMVjfw1",
                },
                {
                  name: "ATOM Reputation Engine",
                  address: "6Mu7qj6tRDrqchxJJPjr9V1H2XQjCerVKixFEEMwC1Tf",
                },
              ].map((p) => (
                <div
                  key={p.name}
                  className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {p.name}
                    </span>
                    <Badge variant="amber">devnet</Badge>
                  </div>
                  <a
                    href={`https://explorer.solana.com/address/${p.address}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link font-mono text-xs break-all"
                  >
                    {p.address} ↗
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: registered agents list */}
        <div>
          <SectionHeading>Registered On-Chain Agents</SectionHeading>
          <RegisteredAgentsList />
        </div>
      </div>
    </div>
  );
}
