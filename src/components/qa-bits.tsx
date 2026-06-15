import { useEffect, useState } from "react";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    passed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
    running: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    pending: "bg-muted text-muted-foreground border-border",
    skipped: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-muted text-muted-foreground border-border",
    open: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    acknowledged: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    ignored: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    info: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${map[severity] ?? map.info}`}>
      {severity}
    </span>
  );
}

export function RelativeTime({ iso }: { iso: string | null | undefined }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!iso) return <>—</>;
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return <>{s}s ago</>;
  const m = Math.round(s / 60);
  if (m < 60) return <>{m}m ago</>;
  const h = Math.round(m / 60);
  if (h < 24) return <>{h}h ago</>;
  const d = Math.round(h / 24);
  return <>{d}d ago</>;
}
