"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useNavigation } from "./NavigationContext";
import { StatusDot } from "./ui";

const ROUTE_NAMES: Record<string, string> = {
  "/": "Overview",
  "/task-center": "Tasks",
  "/agent-registry": "Agent Registry",
  "/trust": "Feedback & Trust",
};

export default function Topbar() {
  const pathname = usePathname();
  const { toggleSidebar } = useNavigation();
  const [slot, setSlot] = useState<number | null>(null);
  const [status, setStatus] = useState<"ok" | "error" | "loading">("loading");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.ok ? "ok" : "error");
        if (d.currentSlot) setSlot(d.currentSlot);
      })
      .catch(() => setStatus("error"));
  }, []);

  const pageTitle = ROUTE_NAMES[pathname] || "Dashboard";

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] md:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[var(--text-secondary)] hidden sm:inline">
            DoBit
          </span>
          <span className="text-[var(--text-muted)] hidden sm:inline">/</span>
          <span className="font-medium text-[var(--text-primary)]">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right actions: Clean Solana Devnet connectivity pill */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs">
          <StatusDot variant={status === "ok" ? "green" : status === "error" ? "red" : "yellow"} />
          <span className="text-[var(--text-secondary)] font-medium">Solana Devnet</span>
          {slot && (
            <span className="text-[var(--text-muted)] font-mono pl-1 border-l border-[var(--border-subtle)]">
              #{slot.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
