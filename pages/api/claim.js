import { ethers } from "ethers";
import { Low, JSONFile } from "lowdb";
import path from "path";

const RPC_URL = process.env.RPC_URL;
const NFT_CONTRACT = process.env.NFT_CONTRACT;
const DAILY_POINTS = 10;
const CLAIM_INTERVAL_MS = 24 * 60 * 60 * 1000;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const ERC721_ABI = ["function balanceOf(address owner) view returns (uint256)"];

const file = path.join(process.cwd(), ".data", "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDb() {
  await db.read();
  db.data ||= { users: {} };
  await db.write();
}

function parsePayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try { return JSON.parse(payload); } catch(e) { return null; }
  }
  return payload;
}

export default async function handler(req, res) {
  await initDb();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accountAssociation } = req.body;
  if (!accountAssociation) return res.status(400).json({ error: 'Missing accountAssociation' });
  const { header, payload, signature } = accountAssociation;
  if (!payload || !signature) return res.status(400).json({ error: 'Incomplete accountAssociation' });
  try {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const recovered = ethers.utils.verifyMessage(payloadStr, signature);
    const parsed = parsePayload(payload);
    const claimedAddress = (parsed?.address || parsed?.wallet || parsed?.sub || recovered).toLowerCase();
    if (!claimedAddress) return res.status(400).json({ error: 'Payload missing address' });
    if (recovered.toLowerCase() !== claimedAddress.toLowerCase()) {
      return res.status(401).json({ error: 'Signature mismatch' });
    }
    const iat = parsed?.iat || parsed?.timestamp || parsed?.createdAt;
    if (iat) {
      const iatMs = Number(iat) * (String(iat).length <= 10 ? 1000 : 1);
      const now = Date.now();
      if (Math.abs(now - iatMs) > 1000 * 60 * 10) {
        return res.status(400).json({ error: 'Payload not fresh' });
      }
    }
    const nft = new ethers.Contract(NFT_CONTRACT, ERC721_ABI, provider);
    const balanceBN = await nft.balanceOf(claimedAddress);
    const balance = balanceBN.toNumber ? balanceBN.toNumber() : Number(balanceBN.toString());
    if (balance === 0) {
      return res.status(403).json({ error: 'Wallet does not own Based Vice Toads NFT' });
    }
    const nowTs = Date.now();
    const userKey = claimedAddress;
    const user = db.data.users[userKey] || { totalPoints:0, lastClaimTs:null, history:[] };
    if (user.lastClaimTs && (nowTs - user.lastClaimTs) < CLAIM_INTERVAL_MS) {
      const remaining = CLAIM_INTERVAL_MS - (nowTs - user.lastClaimTs);
      return res.status(429).json({ error: 'Cannot claim yet', remainingMs: remaining });
    }
    user.totalPoints = (user.totalPoints || 0) + DAILY_POINTS;
    user.lastClaimTs = nowTs;
    user.history = user.history || [];
    user.history.unshift({ ts: nowTs, amount: DAILY_POINTS, note: 'Daily claim — NFT holder' });
    if (user.history.length > 500) user.history = user.history.slice(0,500);
    db.data.users[userKey] = user;
    await db.write();
    return res.status(200).json({
      ok: true,
      address: claimedAddress,
      totalPoints: user.totalPoints,
      lastClaimTs: user.lastClaimTs,
      claimedAmount: DAILY_POINTS,
    });
  } catch (err) {
    console.error('claim error', err);
    return res.status(500).json({ error: 'Internal server error', detail: String(err.message || err) });
  }
}
