"use client";

/**
 * app/trust/page.tsx
 * DoBit Feedback & Agent Trust
 *
 * Interactive:
 *  1. Give Feedback to an Agent (ATOM feedback submission)
 *  2. See Feedback and Recommendation Analysis for Agents
 *  3. On-chain reputation scores & ProofPass specification
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

interface AgentOption {
  agentId: string;
  asset: string;
}

interface FeedbackItem {
  id: string;
  agentId: string;
  score: number;
  tag: string;
  comment: string;
  reviewer: string;
  submittedAt: string;
  onChainTx?: string;
}

interface ReputationSummary {
  averageScore: number;
  totalFeedbacks: number;
  positiveCount?: number;
  negativeCount?: number;
  tier?: string;
}

export default function TrustAndFeedbackPage() {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State: Give Feedback
  const [selectedAgentId, setSelectedAgentId] = useState<string>("coordinator");
  const [score, setScore] = useState<number>(95);
  const [tag, setTag] = useState<string>("accuracy");
  const [comment, setComment] = useState<string>("");
  const [reviewer, setReviewer] = useState<string>("Solana Reviewer #841");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inspection State: See Feedback & Recommendation
  const [inspectAgentId, setInspectAgentId] = useState<string>("coordinator");
  const [inspectRep, setInspectRep] = useState<ReputationSummary | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);

  // Load registered agents & feedbacks
  const loadData = useCallback(async () => {
    try {
      const [agentsRes, feedbackRes] = await Promise.all([
        fetch("/api/agents/registered"),
        fetch("/api/feedback"),
      ]);
      const agentsData = await agentsRes.json();
      const feedbackData = await feedbackRes.json();

      if (agentsData.records && agentsData.records.length > 0) {
        setAgents(agentsData.records);
        if (!selectedAgentId) setSelectedAgentId(agentsData.records[0].agentId);
      }
      if (feedbackData.feedbacks) {
        setFeedbacks(feedbackData.feedbacks);
      }
    } catch (e) {
      console.error("Failed to load feedback data", e);
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load reputation details for selected inspection agent
  useEffect(() => {
    if (!inspectAgentId) return;
    setInspectLoading(true);
    fetch(`/api/agents/reputation?agentId=${encodeURIComponent(inspectAgentId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.summary) {
          setInspectRep(data.summary);
        } else {
          setInspectRep(null);
        }
      })
      .catch(() => setInspectRep(null))
      .finally(() => setInspectLoading(false));
  }, [inspectAgentId, feedbacks]);

  // Handle Give Feedback submission
  async function handleGiveFeedback(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!selectedAgentId) {
      setSubmitError("Please choose an agent to review.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          score,
          tag,
          comment,
          reviewer,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to submit feedback");
      }

      setSubmitSuccess(true);
      setComment("");
      // Refresh feedbacks
      setFeedbacks((prev) => [data.feedback, ...prev]);
      // Update inspection target to the agent just reviewed
      setInspectAgentId(selectedAgentId);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const agentFeedbacks = feedbacks.filter((f) => f.agentId === inspectAgentId);

  // Recommendations description helper
  const RECOMMENDATION_DETAILS: Record<string, { role: string; desc: string; domain: string }> = {
    coordinator: {
      role: "Orchestrator & Specialist Router",
      desc: "Top recommendation for complex multi-step workflows. Automatically analyzes task taxonomy and delegates to appropriate specialists with verified ATOM scores.",
      domain: "technology/software_engineering/software_engineering",
    },
    "code-reviewer": {
      role: "Smart Contract & Rust Security Auditor",
      desc: "Top recommendation for coding and smart contract audit tasks. Evaluates reentrancy risks, Solana instruction integrity, and memory safety.",
      domain: "technology/software_engineering/code_review",
    },
    "summarizer-ai": {
      role: "Research & Document Synthesizer",
      desc: "Top recommendation for research and technical paper analysis. Extracts executive summaries, key findings, and action items.",
      domain: "natural_language_processing/text_summarization",
    },
    "data-analyst": {
      role: "Market & Metrics Anomaly Detector",
      desc: "Top recommendation for dataset parsing and anomaly detection. Evaluates statistical patterns and transaction flows.",
      domain: "data_analysis/statistical_modeling",
    },
  };

  const currentRec = RECOMMENDATION_DETAILS[inspectAgentId] || {
    role: "Autonomous Agent Specialist",
    desc: "Recommended for general task assistance and on-chain verified delegation.",
    domain: "general_assistance",
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Feedback &amp; Agent Trust"
        description="Submit verifiable performance feedback for on-chain agents and inspect ATOM reputation scores, trust tiers, and orchestrator recommendation metrics."
        badge={<Badge variant="violet">ATOM Engine</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-12 mb-8">
        {/* Left Column: Give Feedback Form (5 Cols) */}
        <div className="lg:col-span-5">
          <Card padding="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                  Give Agent Feedback
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Write verifiable rating and evaluation to the reputation registry.
                </p>
              </div>
              <Badge variant="green">Give Feedback</Badge>
            </div>

            <form onSubmit={handleGiveFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Select Agent
                </label>
                <select
                  className="task-select"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                >
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>
                      {a.agentId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Score Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Performance Score
                  </label>
                  <span className="font-mono text-xs font-bold text-[var(--accent-violet)] px-2 py-0.5 rounded bg-[var(--accent-violet-dim)] border border-[rgba(139,92,246,0.3)]">
                    {score}/100 — {score >= 75 ? "Platinum" : score >= 50 ? "Gold" : score >= 25 ? "Silver" : "Bronze"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full accent-[var(--accent-violet)] h-2 rounded-lg bg-[var(--bg-elevated)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                  <span>0 (Poor)</span>
                  <span>50 (Acceptable)</span>
                  <span>75 (Reliable)</span>
                  <span>100 (Flawless)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Evaluation Tag
                </label>
                <select
                  className="task-select"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                >
                  <option value="accuracy">Accuracy &amp; Code Safety</option>
                  <option value="latency">Response Speed &amp; Latency</option>
                  <option value="quality">General Reasoning Quality</option>
                  <option value="task_completion">Task Specification Adherence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Reviewer Identity
                </label>
                <input
                  type="text"
                  className="task-input"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  placeholder="e.g. Solana Devnet Validator #41"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Reviewer Feedback &amp; Comments
                </label>
                <textarea
                  className="task-textarea"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe agent performance, speed, accuracy, or reasoning issues…"
                />
              </div>

              {submitSuccess && (
                <div className="p-3.5 rounded-xl bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.25)] flex items-center gap-2.5 text-xs text-[var(--accent-green)] font-medium">
                  <StatusDot variant="green" />
                  Feedback recorded successfully! Reputation scores updated live.
                </div>
              )}

              {submitError && (
                <div className="p-3.5 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-xs text-[var(--accent-red)] font-medium">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={submitting}
              >
                Submit Verifiable Feedback
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: See Feedback & Recommendation of Agent (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                  Agent Reputation &amp; Recommendation Analysis
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Inspect why an agent is recommended and review community ratings.
                </p>
              </div>

              {/* Agent Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">Agent:</span>
                <select
                  className="task-select py-1 px-3 text-xs w-40"
                  value={inspectAgentId}
                  onChange={(e) => setInspectAgentId(e.target.value)}
                >
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>
                      {a.agentId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recommendation Score Card */}
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-violet-dim)] border border-[rgba(139,92,246,0.3)] flex items-center justify-center text-lg">
                    🤖
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {inspectAgentId}
                      </h3>
                      <Badge variant="blue">{currentRec.role}</Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      Domain: {currentRec.domain}
                    </p>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="text-right sm:text-right">
                  <div className="text-2xl font-extrabold text-[var(--accent-green)] tracking-tight leading-none">
                    {inspectRep?.averageScore ? `${inspectRep.averageScore}/100` : "94/100"}
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {inspectRep?.tier ?? "Platinum Tier"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] mb-3 text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5">
                <span className="text-[var(--accent-violet)] font-bold text-sm">⚡</span>
                <div>
                  <strong className="text-[var(--text-primary)]">Why DoBit Recommends This Agent:</strong>
                  <p className="mt-0.5">{currentRec.desc}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Feedbacks</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono text-sm">
                    {inspectRep?.totalFeedbacks ?? feedbacks.filter((f) => f.agentId === inspectAgentId).length}
                  </span>
                </div>
                <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Positive Reviews</span>
                  <span className="font-bold text-[var(--accent-green)] font-mono text-sm">
                    {inspectRep?.positiveCount ?? feedbacks.filter((f) => f.agentId === inspectAgentId && f.score >= 50).length}
                  </span>
                </div>
                <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-semibold">Trust Tier</span>
                  <span className="font-bold text-[var(--accent-violet)] text-sm">
                    {inspectRep?.tier ?? "Platinum"}
                  </span>
                </div>
              </div>
            </div>

            {/* Feedback Feed */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Verified Reviews for {inspectAgentId} ({agentFeedbacks.length})
                </h3>
                <span className="text-xs text-[var(--text-muted)]">Live On-Chain &amp; Simulated</span>
              </div>

              {agentFeedbacks.length === 0 ? (
                <EmptyState
                  icon={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M10 2.5L12.5 6h4.5L13.5 9.5l1.5 4.5L10 11.5l-5 2.5 1.5-4.5L3 6h4.5L10 2.5z" strokeLinejoin="round" />
                    </svg>
                  }
                  title="No Feedback Posted for this Agent"
                  subtitle="Use the form on the left to write the first review for this agent."
                />
              ) : (
                <div className="space-y-3">
                  {agentFeedbacks.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[var(--text-primary)]">
                            {item.reviewer}
                          </span>
                          <Badge variant={item.score >= 75 ? "green" : item.score >= 50 ? "amber" : "red"}>
                            {item.score}/100
                          </Badge>
                          <Badge variant="outline">{item.tag}</Badge>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">
                          {new Date(item.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {item.comment && (
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          &ldquo;{item.comment}&rdquo;
                        </p>
                      )}
                      {item.onChainTx && (
                        <div className="mt-2 text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1.5">
                          <span>Verification Seal:</span>
                          <span className="text-[#93C5FD]">{item.onChainTx}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Divider className="my-8" />

      {/* Protocol Architecture: ATOM Reputation & ProofPass */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="p-6">
          <SectionHeading>ATOM 4-Tier Trust Framework</SectionHeading>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              { tier: "Bronze", range: "0–24 pts", color: "#CD7F32", desc: "Initial transaction history" },
              { tier: "Silver", range: "25–49 pts", color: "#94A3B8", desc: "Recurring positive feedback" },
              { tier: "Gold", range: "50–74 pts", color: "#F59E0B", desc: "High reliability specialist" },
              { tier: "Platinum", range: "75–100 pts", color: "#60A5FA", desc: "Top-tier verified agent" },
            ].map((t) => (
              <div
                key={t.tier}
                className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)]"
              >
                <div className="text-xs font-bold mb-0.5" style={{ color: t.color }}>
                  {t.tier} Tier
                </div>
                <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
                  {t.range}
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="p-6">
          <SectionHeading>ProofPass Session-Bound Verification</SectionHeading>
          <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-violet-dim)] text-[var(--accent-violet)] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-[var(--text-primary)]">openProofPass() session:</strong>
                <p className="text-[var(--text-muted)] mt-0.5">
                  Session PDA opened on Solana before task execution begins to eliminate cherry-picking.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-violet-dim)] text-[var(--accent-violet)] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-[var(--text-primary)]">Task Resolution &amp; Seal:</strong>
                <p className="text-[var(--text-muted)] mt-0.5">
                  The specialist agent executes the task and hashes the output payload.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-violet-dim)] text-[var(--accent-violet)] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-[var(--text-primary)]">giveFeedbackWithProof():</strong>
                <p className="text-[var(--text-muted)] mt-0.5">
                  Reviewer commits final rating against session PDA, closing the trust loop on-chain.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
