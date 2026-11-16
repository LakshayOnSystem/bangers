// Vercel serverless: iTunes (cover + 30s preview, free, no key) + optional YouTube full-song lookup.
// Add YOUTUBE_API_KEY in Vercel > Settings > Environment Variables to unlock 60-75s full-song clips.
export default async function handler(req, res) {
  const term = (req.query.term || "").toString().slice(0, 120);
  if (!term) return res.status(400).json({ error: "term required" });
  const q = encodeURIComponent(term);
  const key = process.env.YOUTUBE_API_KEY;
  const [it, yt] = await Promise.all([
    fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=5&country=IN`).then(r => r.json()).catch(() => ({})),
    key
      ? fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=1&q=${q}%20official&key=${key}`).then(r => r.json()).catch(() => ({}))
      : Promise.resolve({}),
  ]);
  const t = (it.results || []).find((x) => x.previewUrl) || {};
  const out = {
    previewUrl: t.previewUrl || null,
    title: t.trackName || null,
    artist: t.artistName || null,
    art: (t.artworkUrl100 || "").replace("100x100", "500x500"),
    yt: yt.items?.[0]?.id?.videoId || null,
  };
  if (!out.previewUrl && !out.yt) return res.status(404).json({ error: "not found" });
  res.setHeader("Cache-Control", "s-maxage=604800, stale-while-revalidate");
  res.status(200).json(out);
}
