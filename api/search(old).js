// Vercel serverless function: free iTunes Search API proxy (no key needed)
export default async function handler(req, res) {
  const term = (req.query.term || "").toString().slice(0, 120);
  if (!term) return res.status(400).json({ error: "term required" });
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=5&country=IN`;
    const r = await fetch(url);
    const d = await r.json();
    const t = (d.results || []).find((x) => x.previewUrl);
    if (!t) return res.status(404).json({ error: "not found" });
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).json({
      previewUrl: t.previewUrl,
      title: t.trackName,
      artist: t.artistName,
      art: (t.artworkUrl100 || "").replace("100x100", "400x400"),
    });
  } catch (e) {
    res.status(502).json({ error: "upstream failed" });
  }
}
