import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./db.server");
  const db = getDb();
  let { data } = await db.from("app_settings").select("*").limit(1).maybeSingle();
  if (!data) {
    const ins = await db.from("app_settings").insert({}).select().single();
    if (ins.error) throw new Error(ins.error.message);
    data = ins.data;
  }
  return data;
});

const SettingsInput = z.object({
  id: z.string().uuid(),
  timezone: z.string().max(60).optional(),
  default_language: z.string().max(20).optional(),
  default_hashtag_count: z.number().int().min(0).max(15).optional(),
  x_style_mode: z.string().max(40).optional(),
  linkedin_style_mode: z.string().max(40).optional(),
  image_aspect_ratio: z.string().max(20).optional(),
  image_brand_consistency: z.string().max(20).optional(),
  dark_mode_default: z.boolean().optional(),
  simple_mode: z.boolean().optional(),
  tone_strictness: z.string().max(20).optional(),
});

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SettingsInput.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { id, ...rest } = data;
    const { error } = await getDb().from("app_settings").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
