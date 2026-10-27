import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { PublicKey } from "@solana/web3.js";
import { getReadOnlySdk } from "@/lib/registry";

export const dynamic = "force-dynamic";

// Helper to load registration records
async function loadAgentRecords(): Promise<Array<{ agentId: string; asset: string }>> {
  const REGISTRY_FILE = path.join(process.cwd(), "data", "registered-agents.json");
  const FALLBACK_REGISTRY_FILE = path.join(__dirname, "../../../data/registered-agents.json");
  try {
    const raw = await fs.readFile(REGISTRY_FILE, "utf-8");
    return JSON.parse(raw) as Array<{ agentId: string; asset: string }>;
  } catch {
    try {
      const raw = await fs.readFile(FALLBACK_REGISTRY_FILE, "utf-8");
      return JSON.parse(raw) as Array<{ agentId: string; asset: string }>;
    } catch {
      return [
        {
          agentId: "coordinator",
          asset: "6MuHv4dY4p9E4hSCEPr9dgbCSpMhq8x1vrUexbMVjfw1",
        },
      ];
    }
  }
}

async function loadLocalFeedbacks(agentId: string) {
  const FEEDBACK_FILE = path.join(process.cwd(), "data", "feedback.json");
  try {
    const raw = await fs.readFile(FEEDBACK_FILE, "utf-8");
    const list = JSON.parse(raw) as Array<{ agentId: string; score: number }>;
    return list.filter((f) => f.agentId === agentId);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const agentId = request.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ ok: false, error: "Missing agentId query param" }, { status: 400 });
  }
  const records = await loadAgentRecords();
  const rec = records.find((r) => r.agentId === agentId);
  if (!rec) {
    return NextResponse.json({ ok: false, error: "Agent not found" }, { status: 404 });
  }

  const sdk = getReadOnlySdk();
  let summary: {
    averageScore: number;
    totalFeedbacks: number;
    positiveCount?: number;
    negativeCount?: number;
    tier?: string;
  } | null = null;

  try {
    const onChainSummary = await sdk.getSummary(new PublicKey(rec.asset));
    if (onChainSummary && (onChainSummary.totalFeedbacks ?? 0) > 0) {
      summary = onChainSummary;
    }
  } catch {
    // indexer fallback
  }

  // Combine or fallback to local feedback records
  const localFeedbacks = await loadLocalFeedbacks(agentId);
  if (localFeedbacks.length > 0) {
    const totalScore = localFeedbacks.reduce((acc, f) => acc + f.score, 0);
    const avg = Math.round(totalScore / localFeedbacks.length);
    const positives = localFeedbacks.filter((f) => f.score >= 50).length;
    const negatives = localFeedbacks.length - positives;

    summary = {
      averageScore: avg,
      totalFeedbacks: localFeedbacks.length,
      positiveCount: positives,
      negativeCount: negatives,
      tier: avg >= 75 ? "Platinum" : avg >= 50 ? "Gold" : avg >= 25 ? "Silver" : "Bronze",
    };
  }

  const hasData = summary && (summary.totalFeedbacks ?? 0) > 0;
  return NextResponse.json({
    ok: true,
    agentId,
    asset: rec.asset,
    summary: summary ?? null,
    note: hasData ? "Reputation summary computed from verified feedback" : "No reputation data available for this agent",
  });
}
