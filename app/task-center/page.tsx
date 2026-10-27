"use client";

import { PageHeader, Card, SectionHeading, Badge } from "@/components/ui";
import TaskCenterClient from "./TaskCenterClient";

export default function TaskCenterPage() {
  const handleScrollToNewTask = (e: React.MouseEvent) => {
    e.preventDefault();
    const input = document.getElementById("task-title-input") as HTMLInputElement | null;
    const formCard = document.getElementById("new-task-form");
    if (formCard) {
      formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (input) {
      setTimeout(() => {
        input.focus();
      }, 300);
    }
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Tasks"
        description="Dispatch autonomous tasks, inspect real-time agent recommendation, and monitor execution results on the Solana network."
        badge={<Badge variant="violet">Task Engine</Badge>}
        actions={
          <button
            type="button"
            onClick={handleScrollToNewTask}
            className="btn btn-primary btn-sm shadow-sm cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
            <span>New Task</span>
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left & Center: Interactive task dispatch & history (span 8) */}
        <div className="lg:col-span-8">
          <TaskCenterClient />
        </div>

        {/* Right: Architecture & Delegation Context (span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <Card padding="p-6">
            <SectionHeading>Delegation Architecture</SectionHeading>
            <div className="space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed">
              <p>
                When a task is submitted, DoBit&apos;s orchestrator evaluates candidate agents against the on-chain registry using two deterministic vectors:
              </p>
              <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                <div className="font-semibold text-[var(--text-primary)]">1. ATOM Reputation Vector</div>
                <p className="text-[var(--text-muted)]">
                  Queries on-chain feedback count, average rating (0–100), and Sybil-weighted reviewer reputation.
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                <div className="font-semibold text-[var(--text-primary)]">2. OASF Capability Taxonomy</div>
                <p className="text-[var(--text-muted)]">
                  Matches requested skill requirements (NLP, Rust, Data Analysis) against agent metadata on IPFS.
                </p>
              </div>
            </div>
          </Card>

          <Card padding="p-6">
            <SectionHeading>Execution Modes</SectionHeading>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Live Agent Mode:</span>
                  <p className="text-[var(--text-muted)] mt-0.5">
                    Dispatches directly to agent&apos;s verified A2A endpoint if advertised in the registry NFT.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)] mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Deterministic Demo Mode:</span>
                  <p className="text-[var(--text-muted)] mt-0.5">
                    Runs simulated agent runtime when testing on devnet without external servers.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
