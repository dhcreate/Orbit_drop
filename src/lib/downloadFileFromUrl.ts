/**
 * Triggers a local save dialog without navigating away from the app.
 * Tries a direct fetch first; if CORS blocks it, falls back to a same-origin
 * proxy that only forwards URLs on the configured Convex host.
 */
export async function downloadFileFromUrl(
  url: string,
  filename: string,
): Promise<void> {
  const triggerBlobDownload = (blob: Blob, name: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  };

  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error("bad status");
    const blob = await res.blob();
    triggerBlobDownload(blob, filename);
    return;
  } catch {
    /* CORS or network — try allowlisted proxy */
  }

  const proxyRes = await fetch("/api/storage-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, filename }),
  });
  if (!proxyRes.ok) {
    throw new Error("Download failed");
  }
  const blob = await proxyRes.blob();
  triggerBlobDownload(blob, filename);
}
