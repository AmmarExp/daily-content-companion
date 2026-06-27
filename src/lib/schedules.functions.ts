import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ScheduleInput = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(7).default(0),
  posts_per_day: z.number().int().min(1).max(10).default(1),
  slot_time: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
  platform_mode: z.enum(["x", "linkedin", "both"]).default("both"),
  topic_mode: z.string().max(40).default("auto"),
  image_required: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const listSchedules = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./db.server");
  const { data, error } = await getDb()
    .from("schedules")
    .select("*, projects(name, brand_color)")
    .order("slot_time");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertSchedule = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScheduleInput.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const r = data.id
      ? await db.from("schedules").update(data).eq("id", data.id).select().single()
      : await db.from("schedules").insert(data).select().single();
    if (r.error) throw new Error(r.error.message);
    return r.data;
  });

export const deleteSchedule = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { error } = await getDb().from("schedules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
