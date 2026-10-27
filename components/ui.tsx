"use client";

/**
 * components/ui.tsx
 * Shared design primitives for DoBit — Developer-Grade Dark UI System.
 */

import React from "react";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      iconRight,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`btn btn-${variant} btn-${size} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          icon && <span className="inline-flex shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {!isLoading && iconRight && (
          <span className="inline-flex shrink-0">{iconRight}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
export type BadgeVariant = "violet" | "blue" | "green" | "amber" | "red" | "muted" | "outline";

export function Badge({
  children,
  variant = "muted",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span className={`badge badge-${variant} ${className}`}>{children}</span>
  );
}

// ---------------------------------------------------------------------------
// StatusDot
// ---------------------------------------------------------------------------
export type DotVariant = "green" | "yellow" | "red" | "blue" | "violet" | "muted";

export function StatusDot({
  variant = "green",
  className = "",
}: {
  variant?: DotVariant;
  className?: string;
}) {
  return <span className={`dot dot-${variant} ${className}`} />;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  children,
  className = "",
  padding = "p-5",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div className={`card ${padding} ${className}`}>{children}</div>
  );
}

export function CardInner({
  children,
  className = "",
  padding = "p-4",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return <div className={`card-inner ${padding} ${className}`}>{children}</div>;
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col gap-1.5 mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-base font-semibold text-[var(--text-primary)] tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-xs text-[var(--text-secondary)] leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------
export function MetricCard({
  label,
  value,
  status = "live",
  sub,
  accent,
  icon,
  badge,
}: {
  label: string;
  value: string;
  status?: "live" | "unavailable";
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
        {badge && (
          <Badge variant={status === "live" ? "green" : "muted"}>{badge}</Badge>
        )}
      </div>
      <div>
        <div
          className={`metric-value ${status === "unavailable" ? "na" : ""}`}
          style={status === "live" && accent ? { color: accent } : undefined}
        >
          {value}
        </div>
        {sub && (
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-snug">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionHeading
// ---------------------------------------------------------------------------
export function SectionHeading({
  children,
  action,
  className = "",
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  if (action) {
    return (
      <div className={`flex items-center justify-between mb-3.5 ${className}`}>
        <p className="section-heading mb-0">{children}</p>
        {action}
      </div>
    );
  }
  return <p className={`section-heading ${className}`}>{children}</p>;
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------
export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`divider ${className}`} />;
}

// ---------------------------------------------------------------------------
// DataRow — key/value mono display
// ---------------------------------------------------------------------------
export function DataRow({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`data-row ${className}`}>
      <span className="data-row-key">{label}</span>
      <span className="data-row-value">{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p className="empty-title">{title}</p>
      <p className="empty-subtitle">{subtitle}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComingSoonBanner
// ---------------------------------------------------------------------------
export function ComingSoonBanner({
  phase,
  label,
}: {
  phase: number | string;
  label: string;
}) {
  return (
    <div className="coming-soon-banner">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>
        <strong className="text-[var(--text-primary)]">Phase {phase}:</strong> {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PageHeader
// ---------------------------------------------------------------------------
export function PageHeader({
  title,
  description,
  actions,
  badge,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0 pt-1">
          {actions}
        </div>
      )}
    </div>
  );
}
