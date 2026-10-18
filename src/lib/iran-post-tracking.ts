/** لینک رهگیری پست ایران */
export function iranPostTrackingUrl(code: string): string {
  const c = (code || "").trim();
  return c ? `https://tracking.post.ir/?id=${encodeURIComponent(c)}` : "https://tracking.post.ir/";
}
