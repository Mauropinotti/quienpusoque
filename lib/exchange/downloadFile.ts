/**
 * Descarga un texto como archivo, sin servidor: Blob + link temporal.
 * Devuelve false si el navegador no lo permite.
 */
export function downloadTextFile(fileName: string, content: string, mimeType: string): boolean {
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    // Revocar enseguida corta la descarga en algunos navegadores.
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  } catch {
    return false;
  }
}
