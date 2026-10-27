"use client";

/**
 * components/Sidebar.tsx
 * Persistent navigation sidebar for DoBit.
 * Streamlined: Overview, Tasks (Task Center), Registry, Feedback & Trust.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "./NavigationContext";
import { StatusDot } from "./ui";

const Icons = {
  overview: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="6" height="6" rx="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" />
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="14" height="14" rx="2.5" />
      <path d="M7 10h6M7 7h4M7 13h3.5" strokeLinecap="round" />
    </svg>
  ),
  agents: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3.5 17c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" strokeLinecap="round" />
    </svg>
  ),
  feedback: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2.5L12.5 6h4.5L13.5 9.5l1.5 4.5L10 11.5l-5 2.5 1.5-4.5L3 6h4.5L10 2.5z" strokeLinejoin="round" />
    </svg>
  ),
  solana: (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 11.5h8.5l1.5-1.5H4.5L3 11.5zm0-3.5h8.5L13 6.5H4.5L3 8zM4.5 4.5L3 6H13L11.5 4.5H4.5z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { href: "/",               label: "Overview",             icon: Icons.overview },
  { href: "/task-center",    label: "Tasks",                icon: Icons.tasks,    badge: "Dispatch" },
  { href: "/agent-registry", label: "Agent Registry",       icon: Icons.agents,   badge: "4 Agents" },
  { href: "/trust",          label: "Feedback & Trust",     icon: Icons.feedback, badge: "ATOM" },
];

function DevnetStatusFooter() {
  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [slot, setSlot] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.ok ? "ok" : "error");
        if (d.currentSlot) setSlot(d.currentSlot);
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <span className="w-4 h-4 text-[#9945FF] flex items-center justify-center">
            {Icons.solana}
          </span>
          Solana Devnet
        </div>
        <div className="flex items-center gap-1.5">
          <StatusDot variant={status === "ok" ? "green" : status === "error" ? "red" : "yellow"} />
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            {status === "ok" ? "Connected" : status === "error" ? "Offline" : "Checking"}
          </span>
        </div>
      </div>
      {slot !== null && (
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <span>Slot Height</span>
          <span className="text-[var(--text-secondary)] font-semibold">
            #{slot.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useNavigation();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-logo">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="sidebar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="sidebar-logo-text">DoBit</div>
              <div className="sidebar-logo-sub">Solana Agent Registry</div>
            </div>
          </Link>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] md:hidden"
            aria-label="Close navigation"
          >
            <span className="w-5 h-5 flex">{Icons.close}</span>
          </button>
        </div>

        {/* Clean, Focused Navigation list */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-section-label">Navigation</p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "active" : ""}`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && !active && (
                  <span className="nav-item-phase">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer pb-6">
          <DevnetStatusFooter />
        </div>
      </aside>
    </>
  );
}
