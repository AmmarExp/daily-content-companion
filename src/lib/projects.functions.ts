import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./db.server");
  const { data, error } = await getDb()
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const [p, notes, files, schedules] = await Promise.all([
      db.from("projects").select("*").eq("id", data.id).maybeSingle(),
      db.from("project_knowledge_notes").select("*").eq("project_id", data.id).maybeSingle(),
      db.from("project_knowledge_files").select("*").eq("project_id", data.id).order("uploaded_at", { ascending: false }),
      db.from("schedules").select("*").eq("project_id", data.id).order("slot_time"),
    ]);
    if (p.error) throw new Error(p.error.message);
    return { project: p.data, notes: notes.data, files: files.data ?? [], schedules: schedules.data ?? [] };
  });

const ProjectInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  website_url: z.string().max(300).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  target_audience: z.string().max(500).optional().nullable(),
  main_cta: z.string().max(200).optional().nullable(),
  brand_tone: z.string().max(300).optional().nullable(),
  primary_language: z.string().max(20).default("en"),
  brand_color: z.string().max(20).default("#6366f1"),
  master_brief: z.string().max(50000).optional().nullable(),
});

export const upsertProject = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ProjectInput.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const row = { ...data };
    const result = data.id
      ? await db.from("projects").update(row).eq("id", data.id).select().single()
      : await db.from("projects").insert(row).select().single();
    if (result.error) throw new Error(result.error.message);

    // If a master_brief was provided, extract structured knowledge in the background.
    if (data.master_brief && data.master_brief.trim().length > 30) {
      try {
        await extractBriefInternal(result.data.id, data.master_brief);
      } catch (e) {
        console.error("brief extraction failed", e);
      }
    }
    return result.data;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { error } = await getDb().from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reExtractBrief = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const { data: p, error } = await db.from("projects").select("master_brief").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!p?.master_brief) throw new Error("No brief to extract");
    return extractBriefInternal(data.id, p.master_brief);
  });

async function extractBriefInternal(projectId: string, brief: string) {
  const { createLovableAiGatewayProvider, getApiKey } = await import("./ai-gateway.server");
  const { getDb } = await import("./db.server");
  const gateway = createLovableAiGatewayProvider(getApiKey());
  const model = gateway("google/gemini-3-flash-preview");

  const prompt = `You are a brand strategist. Read the project brief below and extract a structured knowledge base. Output ONLY a JSON object with these keys (all strings, concise but rich):
{
  "summary": "2-3 sentence positioning summary",
  "key_features": "bullet list (use \\n- ) of product/service features",
  "differentiators": "bullet list of what makes this unique",
  "tone_rules": "voice/style guidance for posts",
  "forbidden_topics": "bullet list of topics or claims to avoid",
  "approved_keywords": "comma-separated list of preferred terms/keywords",
  "audience_notes": "who the audience is and what they care about",
  "offer_notes": "current offers, CTAs, pricing hooks",
  "content_pillars": "3-6 content themes the brand should post about regularly"
}

BRIEF:
"""
${brief.slice(0, 30000)}
"""

Return ONLY the JSON object, no markdown fences.`;

  const { text } = await generateText({ model, prompt });
  let parsed: Record<string, string> = {};
  try {
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    parsed = { summary: text.slice(0, 1000) };
  }

  const db = getDb();
  const { data: existing } = await db
    .from("project_knowledge_notes")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  const payload = {
    project_id: projectId,
    summary: parsed.summary ?? null,
    key_features: parsed.key_features ?? null,
    differentiators: parsed.differentiators ?? null,
    tone_rules: parsed.tone_rules ?? null,
    forbidden_topics: parsed.forbidden_topics ?? null,
    approved_keywords: parsed.approved_keywords ?? null,
    audience_notes: parsed.audience_notes ?? null,
    offer_notes: parsed.offer_notes ?? null,
    content_pillars: parsed.content_pillars ?? null,
  };
  if (existing?.id) {
    await db.from("project_knowledge_notes").update(payload).eq("id", existing.id);
  } else {
    await db.from("project_knowledge_notes").insert(payload);
  }
  await db.from("projects").update({ brief_extracted: parsed }).eq("id", projectId);
  return parsed;
}

const NotesInput = z.object({
  project_id: z.string().uuid(),
  summary: z.string().optional().nullable(),
  key_features: z.string().optional().nullable(),
  differentiators: z.string().optional().nullable(),
  tone_rules: z.string().optional().nullable(),
  forbidden_topics: z.string().optional().nullable(),
  approved_keywords: z.string().optional().nullable(),
  audience_notes: z.string().optional().nullable(),
  offer_notes: z.string().optional().nullable(),
  content_pillars: z.string().optional().nullable(),
});

export const saveNotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => NotesInput.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const { data: existing } = await db
      .from("project_knowledge_notes")
      .select("id")
      .eq("project_id", data.project_id)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await db.from("project_knowledge_notes").update(data).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db.from("project_knowledge_notes").insert(data);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
