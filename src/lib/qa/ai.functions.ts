import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SYSTEM = `You are Alyson, an AI QA Agent. You sit inside the user's QA dashboard and have context about the page they're on.
You help them interpret runs, findings, and gates; recommend next actions; and explain QA concepts plainly.
Keep replies under 120 words unless asked for detail. Use plain prose — no markdown headers, no code fences unless explicitly asked.`;

const ROUTE_CONTEXT: Record<string, string> = {
  "/dashboard": "Daily standup view with KPIs across all targets.",
  "/engines": "Catalog of probes Alyson runs (Playwright, Lighthouse, axe-core, ZAP, k6, etc.).",
  "/targets": "Applications & targets connected for QA.",
  "/runs": "List of QA runs and their statuses.",
  "/findings": "Open issues raised by the agent, ready for triage.",
  "/evidence": "Screenshots, logs, traces captured during runs.",
  "/alerts": "Notification feed for failed runs and new findings.",
  "/fix-tasks": "Tasks created from findings, routed to engineering.",
  "/human-review": "Findings that need a human decision before closing.",
  "/auto-fix": "Low-risk findings the agent can draft fixes for.",
  "/personas": "Test personas used to exercise auth and tenant boundaries.",
  "/credentials": "Vault references for persona logins.",
  "/triggers": "When QA runs start (PR, preview, publish, nightly).",
  "/integrations": "Connections to GitHub, Vercel, Slack, Jira, etc.",
  "/gates": "Quality gates that block publish when thresholds fail.",
  "/suites": "Grouped checks reused across targets.",
  "/reports": "Trend lines across runs over the last 14 days.",
  "/settings": "Workspace defaults for runs and the AI assistant.",
};

export const askAlyson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    pathname: z.string(),
    messages: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(4000),
    })).min(1).max(20),
  }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const routeNote = ROUTE_CONTEXT[data.pathname] ?? "Generic QA dashboard view.";
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `${SYSTEM}\n\nCurrent page: ${data.pathname} — ${routeNote}` },
          ...data.messages,
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("AI is rate-limited. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted on this workspace.");
      const txt = await res.text();
      throw new Error(`AI request failed: ${txt.slice(0, 200)}`);
    }
    const json = await res.json() as any;
    const reply = json.choices?.[0]?.message?.content ?? "(no reply)";
    return { reply };
  });
