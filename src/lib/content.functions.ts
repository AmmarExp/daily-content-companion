import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

type KnowledgeBundle = {
  projectName: string;
  language: string;
  brandTone?: string | null;
  audience?: string | null;
  cta?: string | null;
  brandColor?: string | null;
  brief?: string | null;
  notes?: Record<string, string | null> | null;
  recentTopics?: string[];
};

function buildSystemPrompt(b: KnowledgeBundle, platform: "x" | "linkedin" | "both") {
  const isArabic = b.language?.toLowerCase().startsWith("ar");
  const langRule = isArabic
    ? `Write in MODERN Saudi/Gulf-friendly Arabic. Natural, sharp, conversational — not formal MSA, not stiff translation. Use light tasteful emojis only when they add meaning.`
    : `Write in ${b.language || "English"}. Crisp, distinctive, human voice. Avoid AI clichés like "in today's fast-paced world", "unlock", "elevate", "game-changer", "synergy".`;

  return `You are a senior brand copywriter for "${b.projectName}".
${langRule}

BRAND VOICE: ${b.brandTone || "modern, clear, confident, never corporate filler"}
AUDIENCE: ${b.audience || "informed, busy"}
CTA: ${b.cta || "(none)"}

KNOWLEDGE BASE:
${b.brief ? `--- MASTER BRIEF ---\n${b.brief.slice(0, 8000)}\n` : ""}
${b.notes?.summary ? `Summary: ${b.notes.summary}\n` : ""}
${b.notes?.key_features ? `Features:\n${b.notes.key_features}\n` : ""}
${b.notes?.differentiators ? `Differentiators:\n${b.notes.differentiators}\n` : ""}
${b.notes?.content_pillars ? `Content pillars:\n${b.notes.content_pillars}\n` : ""}
${b.notes?.approved_keywords ? `Preferred terms: ${b.notes.approved_keywords}\n` : ""}
${b.notes?.forbidden_topics ? `AVOID: ${b.notes.forbidden_topics}\n` : ""}
${b.notes?.tone_rules ? `Tone rules: ${b.notes.tone_rules}\n` : ""}
${b.notes?.offer_notes ? `Offers: ${b.notes.offer_notes}\n` : ""}

${b.recentTopics?.length ? `RECENT TOPICS (do NOT repeat): ${b.recentTopics.join(" | ")}` : ""}

PLATFORM RULES:
- X post: max 270 chars, punchy hook in line 1, no fluff, 1 strong idea, no hashtag spam (0-2 max), no "1/" threads.
- LinkedIn post: 600-1100 chars, hook in line 1, scannable line breaks, professional but human, ends with a soft CTA or question, 0-3 hashtags at the end.
- Image prompt: ONE high-quality, brand-aware visual concept. Photoreal or sharp editorial illustration. Strong composition. Mention brand color ${b.brandColor || ""} subtly if relevant. No text overlays. No watermarks. No people unless essential.

Return ONLY a JSON object — no markdown, no commentary:
{
  "topic_title": "...",
  "objective": "awareness | engagement | conversion | education",
  "x_post": "...",
  "linkedin_post": "...",
  "cta_text": "...",
  "hashtags": "#one #two",
  "image_prompt": "..."
}`;
}

async function loadProjectBundle(projectId: string): Promise<KnowledgeBundle> {
  const { getDb } = await import("./db.server");
  const db = getDb();
  const [{ data: p }, { data: n }, { data: recent }] = await Promise.all([
    db.from("projects").select("*").eq("id", projectId).maybeSingle(),
    db.from("project_knowledge_notes").select("*").eq("project_id", projectId).maybeSingle(),
    db
      .from("generated_content")
      .select("topic_title")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (!p) throw new Error("Project not found");
  return {
    projectName: p.name,
    language: p.primary_language,
    brandTone: p.brand_tone,
    audience: p.target_audience,
    cta: p.main_cta,
    brandColor: p.brand_color,
    brief: p.master_brief,
    notes: n
      ? {
          summary: n.summary,
          key_features: n.key_features,
          differentiators: n.differentiators,
          tone_rules: n.tone_rules,
          forbidden_topics: n.forbidden_topics,
          approved_keywords: n.approved_keywords,
          audience_notes: n.audience_notes,
          offer_notes: n.offer_notes,
          content_pillars: n.content_pillars,
        }
      : null,
    recentTopics: (recent ?? []).map((r) => r.topic_title).filter(Boolean) as string[],
  };
}

async function generateAndStoreImage(prompt: string, projectId: string, contentId: string) {
  const { generateImage } = await import("./ai-gateway.server");
  const { getDb } = await import("./db.server");
  const b64 = await generateImage(prompt, { size: "1024x1024" });
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const path = `${projectId}/${contentId}.png`;
  const { error } = await getDb()
    .storage.from("generated-images")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

const GenInput = z.object({
  project_id: z.string().uuid(),
  schedule_id: z.string().uuid().optional().nullable(),
  platform: z.enum(["x", "linkedin", "both"]).default("both"),
  content_date: z.string().optional(),
  scheduled_time: z.string().optional().nullable(),
  with_image: z.boolean().default(true),
  topic_hint: z.string().max(500).optional().nullable(),
});

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => GenInput.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { createLovableAiGatewayProvider, getApiKey } = await import("./ai-gateway.server");
    const db = getDb();

    // create row up-front so we have an id
    const { data: row, error: rowErr } = await db
      .from("generated_content")
      .insert({
        project_id: data.project_id,
        schedule_id: data.schedule_id ?? null,
        content_date: data.content_date ?? new Date().toISOString().slice(0, 10),
        scheduled_time: data.scheduled_time ?? null,
        platform: data.platform,
        status: "generating",
        generation_source: "manual",
      })
      .select()
      .single();
    if (rowErr) throw new Error(rowErr.message);

    try {
      const bundle = await loadProjectBundle(data.project_id);
      const gateway = createLovableAiGatewayProvider(getApiKey());
      const model = gateway("google/gemini-3-flash-preview");
      const prompt = buildSystemPrompt(bundle, data.platform);
      const userMsg = data.topic_hint
        ? `Generate today's content. Topic angle hint: ${data.topic_hint}`
        : `Generate today's content. Pick a fresh, specific angle aligned with the content pillars.`;
      const { text } = await generateText({
        model,
        system: prompt,
        prompt: userMsg,
      });

      let parsed: Record<string, string> = {};
      try {
        const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        parsed = { x_post: text.slice(0, 270), linkedin_post: text };
      }

      let imagePath: string | null = null;
      if (data.with_image && parsed.image_prompt) {
        try {
          imagePath = await generateAndStoreImage(parsed.image_prompt, data.project_id, row.id);
        } catch (e) {
          console.error("image gen failed", e);
        }
      }

      const update = {
        topic_title: parsed.topic_title ?? null,
        objective: parsed.objective ?? null,
        x_post: parsed.x_post ?? null,
        linkedin_post: parsed.linkedin_post ?? null,
        cta_text: parsed.cta_text ?? null,
        hashtags: parsed.hashtags ?? null,
        image_prompt: parsed.image_prompt ?? null,
        image_url: imagePath,
        status: "ready",
      };
      await db.from("generated_content").update(update).eq("id", row.id);
      return { id: row.id, ...update };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await db
        .from("generated_content")
        .update({ status: "failed", error_message: msg })
        .eq("id", row.id);
      throw new Error(msg);
    }
  });

export const regenerateImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const { data: row, error } = await db
      .from("generated_content")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (!row.image_prompt) throw new Error("No image prompt to regenerate from");
    const path = await generateAndStoreImage(row.image_prompt, row.project_id, row.id);
    await db.from("generated_content").update({ image_url: path }).eq("id", row.id);
    return { image_url: path };
  });

export const regenerateText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), platform: z.enum(["x", "linkedin", "both"]).default("both") }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const { data: row } = await db.from("generated_content").select("project_id").eq("id", data.id).single();
    if (!row) throw new Error("Not found");
    const bundle = await loadProjectBundle(row.project_id);
    const { createLovableAiGatewayProvider, getApiKey } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(getApiKey());
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: buildSystemPrompt(bundle, data.platform),
      prompt: "Regenerate today's content with a different angle. Return JSON only.",
    });
    let parsed: Record<string, string> = {};
    try {
      const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {};
    }
    const update = {
      topic_title: parsed.topic_title ?? null,
      x_post: parsed.x_post ?? null,
      linkedin_post: parsed.linkedin_post ?? null,
      cta_text: parsed.cta_text ?? null,
      hashtags: parsed.hashtags ?? null,
      image_prompt: parsed.image_prompt ?? null,
    };
    await db.from("generated_content").update(update).eq("id", data.id);
    return update;
  });

const EditInput = z.object({
  id: z.string().uuid(),
  x_post: z.string().nullable().optional(),
  linkedin_post: z.string().nullable().optional(),
  hashtags: z.string().nullable().optional(),
  cta_text: z.string().nullable().optional(),
  topic_title: z.string().nullable().optional(),
  status: z.string().optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
});
export const updateContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EditInput.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { id, ...rest } = data;
    const { error } = await getDb().from("generated_content").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    if (rest.status) {
      await getDb().from("review_actions").insert({ generated_content_id: id, action_type: rest.status });
    }
    return { ok: true };
  });

export const deleteContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { error } = await getDb().from("generated_content").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        project_id: z.string().uuid().optional(),
        platform: z.string().optional(),
        status: z.string().optional(),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
        favorites_only: z.boolean().optional(),
        include_archived: z.boolean().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    let q = getDb()
      .from("generated_content")
      .select("*, projects(name, brand_color)")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.project_id) q = q.eq("project_id", data.project_id);
    if (data.platform) q = q.eq("platform", data.platform);
    if (data.status) q = q.eq("status", data.status);
    if (data.date_from) q = q.gte("content_date", data.date_from);
    if (data.date_to) q = q.lte("content_date", data.date_to);
    if (data.favorites_only) q = q.eq("favorite", true);
    if (!data.include_archived) q = q.eq("archived", false);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listTodayContent = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const { getDb } = await import("./db.server");
  const { data, error } = await getDb()
    .from("generated_content")
    .select("*, projects(name, brand_color)")
    .eq("content_date", today)
    .eq("archived", false)
    .order("scheduled_time", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listReviewQueue = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./db.server");
  const { data, error } = await getDb()
    .from("generated_content")
    .select("*, projects(name, brand_color)")
    .in("status", ["ready", "generating"])
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getImageUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ path: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: signed, error } = await getDb()
      .storage.from("generated-images")
      .createSignedUrl(data.path, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
