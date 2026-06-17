import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listFindings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("findings")
      .select("*, projects(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateFindingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["open", "acknowledged", "resolved", "ignored"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("findings").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createFixTaskFromFinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ finding_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: f, error: fe } = await context.supabase
      .from("findings").select("*").eq("id", data.finding_id).maybeSingle();
    if (fe) throw new Error(fe.message);
    if (!f) throw new Error("Finding not found");

    const sevToPri: Record<string, string> = { critical: "p0", high: "p1", medium: "p2", low: "p3", info: "p3" };
    const requiresHumanReview = f.severity === "critical" || f.kind === "security" || f.kind === "auth";
    const autoFixable = !requiresHumanReview && (f.severity === "low" || f.kind === "a11y" || f.kind === "perf");

    const { data: existing } = await context.supabase
      .from("fix_tasks").select("id").eq("finding_id", data.finding_id).maybeSingle();
    if (existing) return { id: existing.id, existed: true };

    const { data: row, error } = await context.supabase.from("fix_tasks").insert({
      owner_id: context.userId,
      finding_id: f.id,
      run_id: f.run_id,
      title: f.title,
      summary: f.description ?? "",
      priority: sevToPri[f.severity] ?? "p2",
      auto_fixable: autoFixable,
      requires_human_review: requiresHumanReview,
    }).select("id").single();
    if (error) throw new Error(error.message);

    await context.supabase.from("findings").update({ status: "acknowledged" }).eq("id", f.id);
    return { id: row.id, existed: false };
  });
