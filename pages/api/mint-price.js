import { ethers } from "ethers";
import fetch from "node-fetch";

const RPC_URL = process.env.RPC_URL;
const OPENSEA_API = process.env.OPENSEA_API_URL || "https://api.opensea.io/api/v1";
const OPENSEA_KEY = process.env.OPENSEA_API_KEY || "";

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const CANDIDATE_FN = [
  "price",
  "mintPrice",
  "publicSalePrice",
  "salePrice",
  "pricePerToken",
  "getPrice",
  "cost",
  "tokenPrice"
];

async function tryReadContractPrice(contractAddress) {
  for (const name of CANDIDATE_FN) {
    try {
      const abi = [ `function ${name}() view returns (uint256)` ];
      const c = new ethers.Contract(contractAddress, abi, provider);
      const v = await c[name]();
      if (v && (v.toString && v.toString() !== "0")) {
        return { priceWei: ethers.BigNumber.from(v), fn: name };
      }
    } catch (_) {}
  }

  const STRUCT_CANDIDATES = ["saleInfo", "saleDetails", "sale", "getSale"];
  for (const candidate of STRUCT_CANDIDATES) {
    try {
      const abi = [ `function ${candidate}() view returns (uint256)` ];
      const c = new ethers.Contract(contractAddress, abi, provider);
      const v = await c[candidate]();
      if (v) {
        if (ethers.BigNumber.isBigNumber(v)) {
          return { priceWei: v, fn: candidate };
        }
        if (typeof v === "object") {
          const possible = ["price", "mintPrice", "cost", "amount"];
          for (const p of possible) {
            if (v[p]) {
              return { priceWei: ethers.BigNumber.from(v[p]), fn: `${candidate}.${p}` };
            }
          }
          if (v[0]) {
            try { return { priceWei: ethers.BigNumber.from(v[0]), fn: `${candidate}[0]` }; } catch(e) {}
          }
        }
      }
    } catch (_) {}
  }

  return null;
}

async function tryOpenSeaFloor(contractAddress) {
  try {
    const url = `${OPENSEA_API}/assets?asset_contract_address=${contractAddress}&order_direction=asc&limit=50`;
    const headers = { "Accept": "application/json" };
    if (OPENSEA_KEY) headers["X-API-KEY"] = OPENSEA_KEY;
    const r = await fetch(url, { headers });
    if (!r.ok) return null;
    const j = await r.json();
    const assets = j.assets || [];
    let lowest = null;
    for (const a of assets) {
      const order = a?.sell_orders && a.sell_orders.length ? a.sell_orders[0] : null;
      if (!order) continue;
      const priceStr = order.current_price || order.base_price || null;
      if (!priceStr) continue;
      const token = order.payment_token_contract;
      let decimals = 18;
      if (token && token.decimals) decimals = Number(token.decimals);
      const bn = ethers.BigNumber.from(String(priceStr).split('.')[0] || String(priceStr));
      let priceWei = bn;
      if (decimals !== 18) {
        const diff = 18 - decimals;
        if (diff > 0) priceWei = bn.mul(ethers.BigNumber.from(10).pow(diff));
        else priceWei = bn.div(ethers.BigNumber.from(10).pow(-diff));
      }
      if (!lowest || priceWei.lt(lowest)) lowest = priceWei;
    }
    return lowest ? { priceWei: lowest } : null;
  } catch (e) {
    console.error("opensea error", e.message || e);
    return null;
  }
}

export default async function handler(req, res) {
  const contract = String(req.query.contract || req.body?.contract || "").trim();
  if (!contract) {
    return res.status(400).json({ error: "Missing contract address" });
  }
  if (!ethers.utils.isAddress(contract)) {
    return res.status(400).json({ error: "Invalid contract address" });
  }
  try {
    const fromContract = await tryReadContractPrice(contract);
    if (fromContract && fromContract.priceWei) {
      const priceEth = ethers.formatEther(fromContract.priceWei);
      return res.json({ ok: true, source: "contract", fn: fromContract.fn, priceWei: fromContract.priceWei.toString(), priceEth });
    }
    const fromOs = await tryOpenSeaFloor(contract);
    if (fromOs && fromOs.priceWei) {
      const priceEth = ethers.formatEther(fromOs.priceWei);
      return res.json({ ok: true, source: "opensea", priceWei: fromOs.priceWei.toString(), priceEth });
    }
    return res.json({ ok: false, source: "none", message: "No public price found on contract or OpenSea" });
  } catch (e) {
    console.error("mint-price error", e);
    return res.status(500).json({ error: "Server error", detail: String(e.message || e) });
  }
}
