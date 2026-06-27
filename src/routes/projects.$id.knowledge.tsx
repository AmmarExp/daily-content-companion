import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProject } from "@/lib/projects.functions";
import { addKnowledgeFile, deleteKnowledgeFile } from "@/lib/knowledge.functions";
import { AppShell } from "@/components/AppShell";
import { Upload, FileText, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$id/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge · BrandPulse" }] }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const q = useQuery({ queryKey: ["project", id], queryFn: () => getProject({ data: { id } }) });
  const addFn = useServerFn(addKnowledgeFile);
  const delFn = useServerFn(deleteKnowledgeFile);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const project = q.data?.project;
  const files = q.data?.files ?? [];

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("knowledge-files").upload(path, file);
        if (error) throw error;
        let extracted: string | null = null;
        if (file.type.startsWith("text/") || /\.(md|txt|json|csv)$/i.test(file.name)) {
          try { extracted = await file.text(); } catch { /* noop */ }
        }
        await addFn({
          data: {
            project_id: id,
            title: file.name,
            file_path: path,
            file_type: file.type || "application/octet-stream",
            original_filename: file.name,
            extracted_text: extracted ? extracted.slice(0, 200000) : null,
          },
        });
      }
      toast.success("Uploaded");
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const del = useMutation({
    mutationFn: (f: { id: string; file_path: string }) => delFn({ data: f }),
    onSuccess: () => router.invalidate(),
  });

  return (
    <AppShell title="Knowledge files" subtitle={project?.name} back={`/projects/${id}`}>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-card/50 p-8 text-center transition hover:border-primary hover:bg-card"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Upload className="h-5 w-5" />
        </span>
        <div className="font-medium">{uploading ? "Uploading…" : "Tap to upload files"}</div>
        <div className="text-xs text-muted-foreground">PDFs, docs, text — anything brand-related</div>
      </button>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />

      <div className="mt-5 space-y-2">
        {files.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No files yet.
          </div>
        ) : (
          files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.title}</div>
                <div className="truncate text-xs text-muted-foreground">{f.file_type} · {new Date(f.uploaded_at).toLocaleDateString()}</div>
              </div>
              <button
                onClick={() => del.mutate({ id: f.id, file_path: f.file_path })}
                className="tap grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
