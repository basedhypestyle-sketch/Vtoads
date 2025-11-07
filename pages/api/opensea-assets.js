import fetch from 'node-fetch';
const OPENSEA_API = process.env.OPENSEA_API_URL || 'https://api.opensea.io/api/v1';
const OPENSEA_KEY = process.env.OPENSEA_API_KEY;

export default async function handler(req, res) {
  const { contract } = req.query;
  if (!contract) return res.status(400).json({ error: 'missing contract query' });
  const url = `${OPENSEA_API}/assets?asset_contract_address=${contract}&order_direction=desc&limit=20`;
  try {
    const headers = { 'Accept': 'application/json' };
    if (OPENSEA_KEY) headers['X-API-KEY'] = OPENSEA_KEY;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'OpenSea error', detail: text });
    }
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error', detail: e.message });
  }
}
