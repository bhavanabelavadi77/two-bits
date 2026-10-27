import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export interface FeedbackRecord {
  id: string;
  agentId: string;
  score: number; // 0 - 100
  tag: string;
  comment: string;
  reviewer: string;
  submittedAt: string;
  onChainTx?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");

const INITIAL_FEEDBACKS: FeedbackRecord[] = [
  {
    id: "fb-1",
    agentId: "coordinator",
    score: 96,
    tag: "accuracy",
    comment: "Excellent task delegation and specialist discovery on Solana Devnet. Fast response.",
    reviewer: "SolanaDev #4812",
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    onChainTx: "5KqX...9wZb",
  },
  {
    id: "fb-2",
    agentId: "coordinator",
    score: 92,
    tag: "latency",
    comment: "Prompt evaluation heuristics worked seamlessly with the ATOM reputation program.",
    reviewer: "Orchestrator Node #01",
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    onChainTx: "3NzP...7mKq",
  },
];

async function loadFeedbacks(): Promise<FeedbackRecord[]> {
  try {
    const raw = await fs.readFile(FEEDBACK_FILE, "utf-8");
    return JSON.parse(raw) as FeedbackRecord[];
  } catch {
    // If file doesn't exist, seed with initial feedbacks
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(FEEDBACK_FILE, JSON.stringify(INITIAL_FEEDBACKS, null, 2), "utf-8");
    } catch {
      // ignore
    }
    return INITIAL_FEEDBACKS;
  }
}

async function saveFeedbacks(records: FeedbackRecord[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save feedbacks", e);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const agentId = request.nextUrl.searchParams.get("agentId");
  const feedbacks = await loadFeedbacks();

  if (agentId) {
    const filtered = feedbacks.filter((f) => f.agentId === agentId);
    return NextResponse.json({ ok: true, feedbacks: filtered });
  }

  return NextResponse.json({ ok: true, feedbacks });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const { agentId, score, tag, comment, reviewer } = body as {
    agentId?: unknown;
    score?: unknown;
    tag?: unknown;
    comment?: unknown;
    reviewer?: unknown;
  };

  if (!agentId || typeof agentId !== "string") {
    return NextResponse.json({ ok: false, error: "agentId is required" }, { status: 400 });
  }

  const numScore = Number(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 100) {
    return NextResponse.json({ ok: false, error: "score must be between 0 and 100" }, { status: 400 });
  }

  const record: FeedbackRecord = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    agentId,
    score: Math.round(numScore),
    tag: typeof tag === "string" && tag.trim() ? tag.trim() : "quality",
    comment: typeof comment === "string" ? comment.trim() : "",
    reviewer: typeof reviewer === "string" && reviewer.trim() ? reviewer.trim() : "Anonymous Reviewer",
    submittedAt: new Date().toISOString(),
    onChainTx: `${Math.random().toString(36).slice(2, 6).toUpperCase()}...${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  };

  const existing = await loadFeedbacks();
  existing.unshift(record);
  await saveFeedbacks(existing);

  return NextResponse.json({ ok: true, feedback: record });
}
