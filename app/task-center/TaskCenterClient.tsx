"use client";

import {
  Card,
  CardInner,
  SectionHeading,
  EmptyState,
  DataRow,
  Badge,
  Button,
  StatusDot,
  Divider,
} from "@/components/ui";
import { CATEGORY_TO_SKILLS } from "@/lib/skillMap";
import { useEffect, useState, useRef } from "react";

type AgentRecord = {
  agentId: string;
  asset: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  agentId?: string;
  mode: "demo" | "live";
  status: "submitted" | "executing" | "completed" | "failed";
  result?: string;
  createdAt: string;
};

type ReputationSummary = {
  averageScore: number;
  totalFeedbacks: number;
  nextFeedbackIndex?: number;
  totalClients?: number;
  positiveCount?: number;
  negativeCount?: number;
};

type LiveDataMap = Record<string, {
  nft_name?: string;
  owner?: string;
  agent_uri?: string;
  atom_enabled?: boolean;
  collection?: string;
  error?: string;
  domains?: string[];
  a2a_endpoint?: string | null;
}>;

export default function TaskCenterClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [recommendationReason, setRecommendationReason] = useState<string>("");
  const [agentsLiveData, setAgentsLiveData] = useState<LiveDataMap>({});
  const [agentsReputation, setAgentsReputation] = useState<Record<string, ReputationSummary | null>>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [executionMode, setExecutionMode] = useState<"demo" | "live">("demo");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#new-task-form") {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, []);

  // Load task history
  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => {
        setTasks(data.tasks ?? []);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoadError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });

    // Load registered agents
    fetch("/api/agents/registered?load=true")
      .then((r) => r.json())
      .then((data) => {
        setAgents(data.records ?? []);
        setAgentsLiveData(data.liveData ?? {});
        setAgentsLoading(false);
      })
      .catch(() => setAgentsLoading(false));
  }, []);

  // Load reputation data for each agent
  useEffect(() => {
    if (agentsLoading) return;
    let cancelled = false;
    const fetchReps = async () => {
      const reps: Record<string, ReputationSummary | null> = {};
      await Promise.all(
        agents.map(async (a) => {
          try {
            const res = await fetch(`/api/agents/reputation?agentId=${encodeURIComponent(a.agentId)}`);
            const data = await res.json();
            if (data.ok && data.summary) {
              reps[a.agentId] = data.summary;
            } else {
              reps[a.agentId] = null;
            }
          } catch {
            reps[a.agentId] = null;
          }
        })
      );
      if (!cancelled) setAgentsReputation(reps);
    };
    fetchReps();
    return () => {
      cancelled = true;
    };
  }, [agents, agentsLoading]);

  // Compute recommendation
  useEffect(() => {
    if (agentsLoading) return;
    const agentsWithRep = agents.filter((a) => {
      const rep = agentsReputation[a.agentId];
      return rep && rep.totalFeedbacks && rep.totalFeedbacks > 0 && typeof rep.averageScore === "number";
    });
    let recId = "";
    let reason = "";
    if (agentsWithRep.length > 0) {
      agentsWithRep.sort((a, b) => {
        const ra = agentsReputation[a.agentId];
        const rb = agentsReputation[b.agentId];
        const scoreDiff = (rb?.averageScore ?? 0) - (ra?.averageScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (rb?.totalFeedbacks ?? 0) - (ra?.totalFeedbacks ?? 0);
      });
      const best = agentsWithRep[0];
      const bestRep = agentsReputation[best.agentId];
      recId = best.agentId;
      reason = `Agent "${best.agentId}" selected based on ATOM reputation: avgScore ${bestRep?.averageScore ?? 0}, feedbacks ${bestRep?.totalFeedbacks ?? 0}, positives ${bestRep?.positiveCount ?? 0}.`;
    } else {
      let bestMatchAgentId = "";
      let bestMatchReason = "";
      const requiredSkills = CATEGORY_TO_SKILLS[category] ?? [];
      for (const a of agents) {
        const live = agentsLiveData[a.asset];
        const domains = live?.domains;
        if (Array.isArray(domains) && requiredSkills.length > 0) {
          const matchCount = requiredSkills.filter((s) => domains.includes(s)).length;
          if (matchCount > 0) {
            bestMatchAgentId = a.agentId;
            bestMatchReason = `Agent "${a.agentId}" matches ${matchCount}/${requiredSkills.length} requested skills for ${category}.`;
            break;
          }
        }
      }
      if (bestMatchAgentId) {
        recId = bestMatchAgentId;
        reason = bestMatchReason;
      } else if (agents.length > 0) {
        recId = agents[0].agentId;
        reason = `Selected "${agents[0].agentId}" (fallback coordinator).`;
      }
    }
    if (recId && !selectedAgentId) {
      setSelectedAgentId(recId);
      setRecommendationReason(reason);
    }
  }, [agents, agentsLoading, agentsReputation, agentsLiveData, category, selectedAgentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          agentId: selectedAgentId || undefined,
          mode: executionMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setTasks((prev) => [data.task, ...prev]);
      setTitle("");
      setDescription("");
      setCategory("general");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAgentRecord = agents.find((a) => a.agentId === selectedAgentId);
  const selectedAgentLive = selectedAgentRecord ? agentsLiveData[selectedAgentRecord.asset] : null;
  const selectedAgentRep = selectedAgentId ? agentsReputation[selectedAgentId] : null;

  return (
    <div className="space-y-6">
      {/* Submit Task Card */}
      <div id="new-task-form" className="scroll-mt-24">
        <Card padding="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                Dispatch Autonomous Task
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Specify requirements and delegate execution to the Solana agent network.
              </p>
            </div>
            <Badge variant="violet">Task Dispatch</Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Task Title
              </label>
              <input
                ref={titleInputRef}
                id="task-title-input"
                className="task-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Audit Rust Smart Contract for Reentrancy"
              />
            </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Task Description &amp; Context
            </label>
            <textarea
              className="task-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the exact input payload, expected output format, and evaluation criteria…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Domain Category
              </label>
              <select
                className="task-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="research">Research / Summarization</option>
                <option value="coding">Code Review / Generation</option>
                <option value="analysis">Data Analysis</option>
                <option value="general">General Assistance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Execution Mode
              </label>
              <select
                className="task-select"
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as "demo" | "live")}
              >
                <option value="demo">Deterministic Demo (Simulated)</option>
                <option value="live">Live On-Chain Agent (A2A Endpoint)</option>
              </select>
            </div>
          </div>

          {/* Agent Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Target Agent
            </label>
            {agentsLoading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-[var(--text-muted)]">
                <StatusDot variant="yellow" />
                Loading registered agents…
              </div>
            ) : agents.length === 0 ? (
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-muted)]">
                No registered agents found. Please register an agent in the Agent Registry first.
              </div>
            ) : (
              <select
                className="task-select"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
              >
                <option value="">-- Auto-Select / Unassigned Demo --</option>
                {agents.map((a) => (
                  <option key={a.agentId} value={a.agentId}>
                    {a.agentId} — {a.asset.slice(0, 8)}...{a.asset.slice(-6)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected agent intelligence card */}
          {selectedAgentId && selectedAgentRecord && (
            <CardInner padding="p-4" className="mt-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[var(--accent-violet-dim)] border border-[rgba(139,92,246,0.3)] flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Agent Intelligence: {selectedAgentId}
                  </span>
                </div>
                <Badge variant="blue">
                  {selectedAgentLive?.domains?.length ? `${selectedAgentLive.domains.length} Skills` : "Verified"}
                </Badge>
              </div>

              <div className="mono-block text-xs space-y-0 mb-2.5">
                <div className="data-row">
                  <span className="data-row-key">Asset Pubkey</span>
                  <span className="data-row-value text-[#93C5FD]">
                    {selectedAgentRecord.asset}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-row-key">A2A Endpoint</span>
                  <span className="data-row-value">
                    {selectedAgentLive?.a2a_endpoint ? `Advertised (${selectedAgentLive.a2a_endpoint})` : "Local In-Process"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-row-key">ATOM Reputation</span>
                  <span className="data-row-value">
                    {selectedAgentRep && selectedAgentRep.totalFeedbacks ? (
                      <span className="text-[var(--accent-green)] font-semibold">
                        Score: {selectedAgentRep.averageScore}/100 ({selectedAgentRep.totalFeedbacks} feedbacks)
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">No reviews posted yet</span>
                    )}
                  </span>
                </div>
              </div>

              {recommendationReason && (
                <div className="flex items-start gap-2 p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--accent-violet)] font-bold">⚡</span>
                  <span>{recommendationReason}</span>
                </div>
              )}
            </CardInner>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-xs text-[var(--accent-red)] font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={submitting}
          >
            Dispatch Task to Network
          </Button>
        </form>
      </Card>
      </div>

      {/* Task History Feed */}
      <Card padding="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
              Task Execution Feed
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Live log of submitted tasks, orchestrator dispatches, and verification results.
            </p>
          </div>
          <Badge variant="muted">{tasks.length} Total</Badge>
        </div>

        {loadError && !loading ? (
          <div className="space-y-3">
            <p className="text-xs text-[var(--accent-red)]">Error loading tasks: {loadError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setLoading(true);
                setLoadError(null);
                fetch("/api/tasks")
                  .then((r) => r.json())
                  .then((data) => {
                    setTasks(data.tasks ?? []);
                    setLoading(false);
                  })
                  .catch((e) => {
                    setLoadError(e instanceof Error ? e.message : String(e));
                    setLoading(false);
                  });
              }}
            >
              Retry Loading Feed
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2.5 py-6 text-sm text-[var(--text-secondary)]">
            <StatusDot variant="yellow" />
            Loading task history…
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="14" height="14" rx="2.5" />
                <path d="M7 10h6M7 7h4M7 13h3.5" strokeLinecap="round" />
              </svg>
            }
            title="No Tasks Dispatched Yet"
            subtitle="Submit your first autonomous task using the form above."
          />
        ) : (
          <div className="space-y-4">
            {tasks.map((t) => {
              const statusVariant =
                t.status === "completed"
                  ? "green"
                  : t.status === "failed"
                  ? "red"
                  : "amber";

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] space-y-3 transition-colors hover:border-[var(--border-strong)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-sm text-[var(--text-primary)]">
                        {t.title}
                      </span>
                      <Badge variant={statusVariant}>{t.status}</Badge>
                      <Badge variant="outline">{t.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                      <span>{new Date(t.createdAt).toLocaleTimeString()}</span>
                      <span className="border-l border-[var(--border-subtle)] pl-2">
                        {t.mode === "live" ? "Live Agent" : "Demo Mode"}
                      </span>
                    </div>
                  </div>

                  {t.description && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {t.description}
                    </p>
                  )}

                  {t.agentId && (
                    <div className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-2">
                      <span>Assigned Agent:</span>
                      <span className="text-[#93C5FD] font-semibold">{t.agentId}</span>
                    </div>
                  )}

                  {t.result && (
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
                      <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                        Execution Output
                      </p>
                      <div className="text-xs text-[var(--text-primary)] font-mono whitespace-pre-wrap leading-relaxed">
                        {t.result}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
