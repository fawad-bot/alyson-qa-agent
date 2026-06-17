import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Capture is strictly the project's landing page (target_url root).
// Sub-paths from finding.location are intentionally ignored so evidence
// stays anchored to the page actually under test.
function resolveTargetUrl(targetUrl: string | null | undefined): string | null {
  if (!targetUrl) return null;
  return targetUrl.replace(/\/$/, "");
}

async function captureOne(evidenceId: string, userId: string) {
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  if (!accessKey) throw new Error("SCREENSHOTONE_ACCESS_KEY is not configured");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: ev, error: evErr } = await supabaseAdmin
    .from("evidence_items")
    .select("id, owner_id, run_id, payload, qa_runs(project_id, projects(target_url))")
    .eq("id", evidenceId)
    .maybeSingle();
  if (evErr) throw new Error(evErr.message);
  if (!ev) throw new Error("Evidence not found");
  if (ev.owner_id !== userId) throw new Error("Forbidden");

  const targetUrl = (ev as any).qa_runs?.projects?.target_url as string | null;
  const url = resolveTargetUrl(targetUrl);
  if (!url) {
    await supabaseAdmin
      .from("evidence_items")
      .update({ payload: { ...((ev.payload as Record<string, unknown>) ?? {}), status: "no_target_url", error: "Project has no landing-page URL set. Add it on the Targets page." } })
      .eq("id", evidenceId);
    throw new Error("This target has no landing-page URL. Open Targets and set the URL of the page being tested.");
  }

  // Call ScreenshotOne
  const params = new URLSearchParams({
    access_key: accessKey,
    url,
    format: "png",
    viewport_width: "1280",
    viewport_height: "720",
    device_scale_factor: "1",
    block_ads: "true",
    block_cookie_banners: "true",
    cache: "false",
    response_type: "by_format",
    image_quality: "80",
  });
  const apiUrl = `https://api.screenshotone.com/take?${params.toString()}`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ScreenshotOne ${res.status}: ${body.slice(0, 300)}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());

  const path = `${userId}/${ev.run_id}/${evidenceId}.png`;
  const { error: upErr } = await supabaseAdmin.storage
    .from("evidence")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  // 7 day signed URL
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("evidence")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signErr || !signed?.signedUrl) throw new Error(`Sign failed: ${signErr?.message ?? "no url"}`);

  await supabaseAdmin
    .from("evidence_items")
    .update({
      url: signed.signedUrl,
      payload: { ...((ev.payload as Record<string, unknown>) ?? {}), status: "captured", source: "screenshotone", target_url: url, storage_path: path, captured_at: new Date().toISOString() },
    })
    .eq("id", evidenceId);

  return { url: signed.signedUrl, path };
}

export const captureEvidenceScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ evidenceId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const res = await captureOne(data.evidenceId, context.userId);
      return { ok: true as const, url: res.url, path: res.path };
    } catch (e: any) {
      // Return as a typed error result so the client can show a toast
      // without triggering the runtime-error boundary / blank screen.
      return { ok: false as const, error: String(e?.message ?? e) };
    }
  });

export const captureRunScreenshots = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ runId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("evidence_items")
      .select("id, owner_id")
      .eq("run_id", data.runId)
      .eq("kind", "screenshot")
      .is("url", null);
    if (error) throw new Error(error.message);
    const mine = (rows ?? []).filter(r => r.owner_id === context.userId);
    const results = await Promise.allSettled(mine.map(r => captureOne(r.id, context.userId)));
    return {
      total: mine.length,
      captured: results.filter(r => r.status === "fulfilled").length,
      failed: results.filter(r => r.status === "rejected").length,
    };
  });
