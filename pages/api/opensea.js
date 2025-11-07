export default async function handler(req, res) {
  const slug = req.query.slug || 'based‑vice‑toads';
  const apiKey = process.env.OPENSEA_API_KEY || '';
  const url = `https://api.opensea.io/api/v2/collections/${slug}`;

  const headers = { accept: 'application/json' };
  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'OpenSea error', detail: text });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('opensea proxy error', err);
    return res.status(500).json({ error: 'Failed to fetch OpenSea', detail: String(err.message || err) });
  }
}
