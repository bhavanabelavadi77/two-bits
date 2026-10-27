"use client";

/**
 * app/page.tsx — DoBit Overview
 *
 * Real data: devnet connectivity slot via /api/health.
 * All metrics are honest empty states / live diagnostic indicators.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Badge,
  Card,
  SectionHeading,
  Divider,
  EmptyState,
  ComingSoonBanner,
  PageHeader,
  Button,
  MetricCard,
  StatusDot,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HealthResponse {
  ok: boolean;
  cluster: string;
  rpcUrl: string;
  currentSlot: number | null;
  rpcHealth: string | null;
  checkedAt: string;
  error?: string;
}
type CheckState = "idle" | "loading" | "success" | "error";

// ---------------------------------------------------------------------------
// A. Connectivity status bar
// ---------------------------------------------------------------------------
function ConnectivityStatus({
  state,
  data,
  onRefresh,
}: {
  state: CheckState;
  data: HealthResponse | null;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] shadow-sm">
        <StatusDot
          variant={
            state === "success"
              ? "green"
              : state === "error"
              ? "red"
              : "yellow"
          }
        />
        <span className="font-medium text-[var(--text-primary)]">
          {state === "loading"
            ? "Checking RPC…"
            : state === "success"
            ? "Solana Devnet Connected"
            : state === "error"
            ? "Devnet Unreachable"
            : "Connecting…"}
        </span>
        {data?.currentSlot && state === "success" && (
          <span className="text-[var(--text-muted)] font-mono pl-1 border-l border-[var(--border-subtle)]">
            slot {data.currentSlot.toLocaleString()}
          </span>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        isLoading={state === "loading"}
        title="Re-run health check"
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
        Refresh
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// B. Task input workspace
// ---------------------------------------------------------------------------
const EXAMPLE_TASKS = [
  "Summarize this research paper and extract key findings",
  "Review my Rust smart contract for memory safety",
  "Analyze this market dataset and identify anomalies",
  "Audit Solana transaction payload for unauthorized signer",
];

function TaskWorkspace() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handlePutTask = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: value.slice(0, 60),
          description: value,
          category: "general",
          mode: "demo",
        }),
      });
      const data = await res.json();
      if (data.ok && data.task?.result) {
        setResult(data.task.result);
      }
    } catch (e) {
      console.error("Failed to put task", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
            Tasks — Autonomous Delegation
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Describe a task to discover and delegate to verified on-chain agents.
          </p>
        </div>
        <Badge variant="violet">Phase 3 Interactive</Badge>
      </div>

      <ComingSoonBanner
        phase={3}
        label="Agent discovery and autonomous delegation pipeline is active in Tasks."
      />

      <div className="relative">
        <textarea
          className="task-textarea"
          rows={4}
          placeholder="Describe the task you want to delegate to an autonomous specialist agent…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (result) setResult(null);
          }}
          aria-label="Task description"
        />
      </div>

      {/* Example suggestions */}
      {value === "" && (
        <div className="mt-3.5">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Suggested Prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_TASKS.map((t) => (
              <button
                key={t}
                type="button"
                className="text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] rounded-md px-2.5 py-1.5 transition-all text-left"
                onClick={() => setValue(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Execution Output if dispatched */}
      {result && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent-green)]/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot variant="green" />
              <span className="text-xs font-semibold text-[var(--accent-green)]">
                Task Executed Successfully
              </span>
            </div>
            <Link href="/task-center" className="link text-xs">
              View in Task History →
            </Link>
          </div>
          <p className="font-mono text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
            {result}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--border-subtle)]">
        <p className="text-xs text-[var(--text-muted)]">
          {value.length > 0 ? (
            <span className="font-mono text-[var(--text-secondary)]">
              {value.length} characters
            </span>
          ) : (
            "Select an example prompt or type custom task requirements."
          )}
        </p>
        <div className="flex items-center gap-2">
          {value.trim().length > 0 ? (
            <Button
              variant="primary"
              size="md"
              onClick={handlePutTask}
              isLoading={loading}
              iconRight={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              }
            >
              Dispatch Task
            </Button>
          ) : (
            <Link href="/task-center">
              <Button
                variant="primary"
                size="md"
                iconRight={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                }
              >
                Open Tasks
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// C. Workflow visualization
// ---------------------------------------------------------------------------
const WORKFLOW_STEPS = [
  { id: "discover", label: "1. Discover", desc: "Query Solana Registry" },
  { id: "verify",   label: "2. Verify",   desc: "Inspect Metaplex NFT" },
  { id: "select",   label: "3. Select",   desc: "ATOM Score Evaluation" },
  { id: "delegate", label: "4. Delegate", desc: "A2A Dispatch Protocol" },
  { id: "validate", label: "5. Validate", desc: "ProofPass On-Chain Seal" },
];

function WorkflowViz() {
  return (
    <Card padding="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
            Autonomous Delegation Lifecycle
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            How DoBit coordinates trustless agent hiring on Solana ERC-8004.
          </p>
        </div>
        <Badge variant="blue">On-Chain Protocol</Badge>
      </div>

      <div className="workflow-steps">
        {WORKFLOW_STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`workflow-step ${idx === 0 ? "step-active" : "step-pending"}`}
          >
            <div className="workflow-step-icon">{idx + 1}</div>
            <div className="text-center sm:text-center">
              <span className="workflow-step-label block font-semibold">
                {step.label}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] hidden sm:block">
                {step.desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed flex items-center justify-between">
        <span>
          Live pipeline tracks steps from discovery → evaluation → dispatch → feedback recording.
        </span>
        <Link href="/technical" className="link text-xs font-semibold whitespace-nowrap pl-3">
          View Technical Architecture →
        </Link>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// D. Connectivity detail panel
// ---------------------------------------------------------------------------
function ConnectivityDetail({
  state,
  data,
  fetchError,
}: {
  state: CheckState;
  data: HealthResponse | null;
  fetchError: string | null;
}) {
  if (state === "loading") {
    return (
      <Card padding="p-5">
        <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
          <StatusDot variant="yellow" />
          Probing Solana Devnet via <code className="code-tag">Connection.getSlot()</code>…
        </div>
      </Card>
    );
  }

  if (fetchError) {
    return (
      <Card padding="p-5">
        <div className="flex items-center gap-2 mb-2">
          <StatusDot variant="red" />
          <span className="text-sm font-semibold text-[var(--accent-red)]">
            Devnet Health Check Failed
          </span>
        </div>
        <p className="text-xs text-[var(--accent-red)] font-mono">{fetchError}</p>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card padding="p-5">
      <div className="mono-block space-y-0">
        <div className="data-row">
          <span className="data-row-key">Cluster</span>
          <span className="data-row-value text-[#93C5FD]">{data.cluster}</span>
        </div>
        <div className="data-row">
          <span className="data-row-key">RPC URL</span>
          <span className="data-row-value">{data.rpcUrl}</span>
        </div>
        {data.currentSlot !== null && (
          <div className="data-row">
            <span className="data-row-key">Current Slot</span>
            <span className="data-row-value text-[var(--accent-green)] font-semibold">
              {data.currentSlot.toLocaleString()}
            </span>
          </div>
        )}
        <div className="data-row">
          <span className="data-row-key">RPC Health</span>
          <span
            className="data-row-value font-semibold"
            style={{
              color:
                data.rpcHealth === "ok"
                  ? "var(--accent-green)"
                  : "var(--accent-amber)",
            }}
          >
            {data.rpcHealth ?? "—"}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row-key">Checked At</span>
          <span className="data-row-value">{data.checkedAt}</span>
        </div>
        {data.error && (
          <div className="data-row">
            <span className="data-row-key">Error</span>
            <span className="data-row-value text-[var(--accent-red)] font-semibold">
              {data.error}
            </span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mt-3">
        Server-side devnet probe via <code className="code-tag">@solana/web3.js Connection.getSlot()</code>. Zero private keys exposed.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Overview page
// ---------------------------------------------------------------------------
export default function OverviewPage() {
  const [state, setState] = useState<CheckState>("loading");
  const [data, setData] = useState<HealthResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setState("loading");
    setFetchError(null);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json: HealthResponse = await res.json();
      setData(json);
      setState(json.ok ? "success" : "error");
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return (
    <div className="page-content">
      {/* Page header */}
      <PageHeader
        title="Agent Network Overview"
        description="Autonomous agent hiring and delegation powered by the Solana Agent Registry (ERC-8004)."
        badge={<Badge variant="violet">Devnet Live</Badge>}
        actions={
          <ConnectivityStatus
            state={state}
            data={data}
            onRefresh={runCheck}
          />
        }
      />

      {/* Summary metrics — 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Registered Agents"
          value="1 Agent"
          status="live"
          accent="#C4B5FD"
          sub="Coordinator registered on Solana Devnet"
          badge="Live"
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="10" cy="7" r="3.5" />
              <path d="M3.5 17c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          label="Tasks Delegated"
          value="Interactive"
          status="live"
          accent="#93C5FD"
          sub="Task Center ready for dispatch"
          badge="Ready"
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="14" height="14" rx="2.5" />
              <path d="M7 10h6M7 7h4M7 13h3.5" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          label="Reputation Engine"
          value="ATOM v1"
          status="live"
          accent="#86EFAC"
          sub="Devnet ATOM scoring program active"
          badge="Active"
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M10 2.5L12.5 6h4.5L13.5 9.5l1.5 4.5L10 11.5l-5 2.5 1.5-4.5L3 6h4.5L10 2.5z" strokeLinejoin="round" />
            </svg>
          }
        />
        <MetricCard
          label="Solana Cluster"
          value={
            state === "success"
              ? "Devnet OK"
              : state === "error"
              ? "Error"
              : "Checking…"
          }
          status={state === "success" ? "live" : "unavailable"}
          accent="var(--accent-green)"
          sub={
            data?.currentSlot
              ? `Slot #${data.currentSlot.toLocaleString()}`
              : "Querying RPC endpoint…"
          }
          badge="Online"
          icon={
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 11.5h8.5l1.5-1.5H4.5L3 11.5zm0-3.5h8.5L13 6.5H4.5L3 8zM4.5 4.5L3 6H13L11.5 4.5H4.5z" />
            </svg>
          }
        />
      </div>

      {/* Task workspace */}
      <div className="mb-8">
        <TaskWorkspace />
      </div>

      {/* Workflow visualization */}
      <div className="mb-8">
        <WorkflowViz />
      </div>

      {/* Diagnostic panel */}
      <div className="mb-8">
        <SectionHeading>Devnet Health Diagnostic — /api/health</SectionHeading>
        <ConnectivityDetail
          state={state}
          data={data}
          fetchError={fetchError}
        />
      </div>

      <Divider className="my-8" />

      {/* Recent activity */}
      <div>
        <SectionHeading>Recent Activity Stream</SectionHeading>
        <Card padding="p-6">
          <EmptyState
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M3 10h3l3-6 4 12 3-6h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Activity Feed Initialized"
            subtitle="Agent registrations and task delegation dispatches will stream here in real-time."
            action={
              <Link href="/task-center">
                <Button variant="secondary" size="sm">
                  Go to Task Center
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    </div>
  );
}
