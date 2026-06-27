import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getImageUrl } from "@/lib/content.functions";

export function StoredImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const getUrl = useServerFn(getImageUrl);
  useEffect(() => {
    let cancelled = false;
    getUrl({ data: { path } })
      .then((r) => !cancelled && setUrl(r.url))
      .catch(() => !cancelled && setUrl(null));
    return () => { cancelled = true; };
  }, [path, getUrl]);
  if (!url)
    return (
      <div className={`grid place-items-center bg-muted text-xs text-muted-foreground ${className ?? ""}`}>
        Loading…
      </div>
    );
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
