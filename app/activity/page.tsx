"use client";

/**
 * app/activity/page.tsx
 * DoBit Activity Logs — Phase 4 Real-time Event Stream.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Badge,
  Card,
  SectionHeading,
  EmptyState,
  ComingSoonBanner,
  PageHeader,
  Button,
  StatusDot,
} from "@/components/ui";

const PLANNED_EVENT_TYPES = [
  {
    type: "registry_query",
    label: "Registry Query",
    color: "blue" as const,
    badgeVariant: "blue" as const,
    desc: "Agent identity and metadata lookup via 8004-solana SDK",
  },
  {
    type: "agent_registration",
    label: "Agent Registration",
    color: "violet" as const,
    badgeVariant: "violet" as const,
    desc: "Metaplex Core NFT mint + IPFS JSON upload on Solana Devnet",
  },
  {
    type: "agent_selected",
    label: "Agent Selected",
    color: "violet" as const,
    badgeVariant: "violet" as const,
    desc: "Orchestrator selected specialist agent based on ATOM score + OASF skill taxonomy",
  },
  {
    type: "task_delegated",
    label: "Task Delegated",
    color: "yellow" as const,
    badgeVariant: "amber" as const,
    desc: "Task payload dispatched to agent A2A / MCP endpoint",
  },
  {
    type: "feedback_submitted",
    label: "Feedback Submitted",
    color: "green" as const,
    badgeVariant: "green" as const,
    desc: "giveFeedback() / ProofPass cryptographic seal written on-chain",
  },
  {
    type: "validation_failed",
    label: "Validation Failed",
    color: "red" as const,
    badgeVariant: "red" as const,
    desc: "Result payload failed threshold quality or cryptographic signature verification",
  },
];

function EventTypeLegend() {
  return (
    <Card padding="p-6">
      <SectionHeading>Supported Event Taxonomy</SectionHeading>
      <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
        The activity logger records deterministic events across the discovery, delegation, and feedback cycles. On-chain events include Solana Explorer transaction links.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLANNED_EVENT_TYPES.map((e) => (
          <div
            key={e.type}
            className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-start gap-3 hover:border-[var(--border-strong)] transition-all"
          >
            <StatusDot variant={e.color} className="mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {e.label}
                </span>
                <Badge variant={e.badgeVariant}>{e.type}</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {e.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LogShell() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  return (
    <Card padding="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
            Event Log Feed
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Audit trail of network requests, on-chain transactions, and delegation status.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search event logs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="task-input py-1.5 px-3 text-xs w-48"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled
            title="Filter options available in Phase 4"
            icon={
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
              </svg>
            }
          >
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Export options available in Phase 4"
            icon={
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M8 2v9M4 7l4 4 4-4M2 14h12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            Export
          </Button>
        </div>
      </div>

      <div className="p-8 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
        <EmptyState
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M3 10h3l3-6 4 12 3-6h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="No Events Recorded Yet"
          subtitle="Real-time activity logs will stream here as you register agents and dispatch tasks in the network."
          action={
            <Link href="/task-center">
              <Button variant="primary" size="sm">
                Submit a Task in Task Center
              </Button>
            </Link>
          }
        />
      </div>
    </Card>
  );
}

export default function ActivityPage() {
  return (
    <div className="page-content">
      <PageHeader
        title="Activity Logs"
        description="A real-time record of registry queries, agent selection, task delegation, validation results, and on-chain feedback transactions."
        badge={<Badge variant="violet">Phase 4</Badge>}
      />

      <ComingSoonBanner
        phase={2}
        label="The first on-chain activity entries will appear when agent registration transactions are finalized on Solana Devnet."
      />

      <div className="space-y-6">
        <LogShell />
        <EventTypeLegend />
      </div>
    </div>
  );
}
