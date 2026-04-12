/**
 * Programmatic CV PDF download (optional Bearer), matching {@link CvPdfDownloadButton} behavior.
 */
export async function downloadCvPdfClient(
  fetchUrl: string,
  fileStem: string,
  accessToken?: string,
): Promise<boolean> {
  const headers: HeadersInit = {};
  const t = accessToken?.trim();
  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }

  try {
    const res = await fetch(fetchUrl, { headers, cache: "no-store" });
    if (!res.ok) {
      return false;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileStem}.pdf`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
