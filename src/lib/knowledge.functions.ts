import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const UploadInput = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  file_path: z.string().min(1).max(500),
  file_type: z.string().max(50).optional().nullable(),
  original_filename: z.string().max(300).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  extracted_text: z.string().max(200000).optional().nullable(),
});

export const addKnowledgeFile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UploadInput.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: row, error } = await getDb()
      .from("project_knowledge_files")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteKnowledgeFile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), file_path: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    await db.storage.from("knowledge-files").remove([data.file_path]).catch(() => {});
    const { error } = await db.from("project_knowledge_files").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSignedFileUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ path: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: signed, error } = await getDb().storage
      .from("knowledge-files")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
