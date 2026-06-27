import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily content generator — called by pg_cron.
 * Iterates active schedules and generates today's content for each slot
 * that doesn't already have a row for today.
 */
export const Route = createFileRoute("/api/public/hooks/daily-generate")({
  server: {
    handlers: {
      POST: async () => {
        const { getDb } = await import("@/lib/db.server");
        const db = getDb();
        const today = new Date().toISOString().slice(0, 10);
        const todayDow = new Date().getUTCDay() === 0 ? 7 : new Date().getUTCDay(); // 1-7

        const { data: schedules, error } = await db
          .from("schedules")
          .select("*")
          .eq("active", true);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const results: Array<{ schedule_id: string; status: string; error?: string }> = [];
        for (const s of schedules ?? []) {
          if (s.day_of_week !== 0 && s.day_of_week !== todayDow) continue;
          // skip if already generated today
          const { data: existing } = await db
            .from("generated_content")
            .select("id")
            .eq("schedule_id", s.id)
            .eq("content_date", today)
            .maybeSingle();
          if (existing) {
            results.push({ schedule_id: s.id, status: "skipped" });
            continue;
          }
          try {
            const { generateContent } = await import("@/lib/content.functions");
            // call handler directly server-side
            await (generateContent as unknown as (i: { data: unknown }) => Promise<unknown>)({
              data: {
                project_id: s.project_id,
                schedule_id: s.id,
                platform: s.platform_mode as "x" | "linkedin" | "both",
                content_date: today,
                scheduled_time: s.slot_time,
                with_image: s.image_required,
              },
            });
            results.push({ schedule_id: s.id, status: "ok" });
          } catch (e) {
            results.push({
              schedule_id: s.id,
              status: "error",
              error: e instanceof Error ? e.message : "unknown",
            });
          }
        }
        return Response.json({ date: today, results });
      },
    },
  },
});
