import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";

const CONTRACT_ADDR =
  process.env.NEXT_PUBLIC_NFT_CONTRACT ||
  "0xaaf5e6fdcd17dfe3e3975930126c28b2ad182cca";

const ABI = [
  "function mintPublic(address nftContract, address feeRecipient, address minterIfNotPayer, uint256 quantity) payable",
  "function totalSupply() view returns (uint256)",
  "function maxSupply() view returns (uint256)",
  "function maxMint() view returns (uint256)",
  "function price() view returns (uint256)",
];

export default function MintPage() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const [totalMinted, setTotalMinted] = useState(null);
  const [maxSupply, setMaxSupply] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [priceEth, setPriceEth] = useState(null);
  const [collection, setCollection] = useState(null);
  const [collectionLoading, setCollectionLoading] = useState(false);

  // Load collection metadata
  useEffect(() => {
    let isMounted = true;
    async function loadCollection() {
      try {
        setCollectionLoading(true);
        const res = await fetch("/api/opensea?slug=based-vice-toads");
        const j = await res.json();
        if (isMounted && j && j.collection) {
          setCollection(j.collection);
        }
      } catch (e) {
        console.error("Failed loading collection", e);
      } finally {
        if (isMounted) setCollectionLoading(false);
      }
    }
    loadCollection();
    return () => {
      isMounted = false;
    };
  }, []);

  // loadSupply defined with useCallback so dependencies stable
  const loadSupply = useCallback(async () => {
    try {
      const rpc = process.env.RPC_URL || null;
      const p =
        rpc
          ? new ethers.JsonRpcProvider(rpc)
          : typeof window !== "undefined" && window.ethereum
            ? new ethers.BrowserProvider(window.ethereum)
            : null;

      if (!p) {
        return;
      }

      const contract = new ethers.Contract(CONTRACT_ADDR, ABI, p);
      let ts = null;
      let ms = null;

      try {
        ts = await contract.totalSupply();
      } catch (_) {
        ts = null;
      }
      try {
        ms = await contract.maxSupply();
      } catch (_) {
        ms = null;
      }
      if (!ts) {
        try {
          ts = await contract.maxMint();
        } catch (_) {
          ts = null;
        }
      }

      try {
        const pwei = await contract.price();
        setPriceEth(ethers.formatEther(pwei));
      } catch (_) {
        setPriceEth(null);
      }

      setTotalMinted(ts ? Number(ts.toString()) : null);
      setMaxSupply(ms ? Number(ms.toString()) : null);
    } catch (e) {
      console.error("loadSupply error", e);
    }
  }, []);

  // Interval to refresh supply every 30s
  useEffect(() => {
    let isMounted = true;
    async function initLoad() {
      if (isMounted) await loadSupply();
    }
    initLoad();
    const iv = setInterval(loadSupply, 30000);
    return () => {
      isMounted = false;
      clearInterval(iv);
    };
  }, [loadSupply]);

  const connectWallet = async () => {
    setError(null);
    try {
      const w3 = new Web3Modal({ cacheProvider: true });
      const conn = await w3.connect();
      const p = new ethers.BrowserProvider(conn);
      const s = await p.getSigner();
      const addr = await s.getAddress();
      setProvider(p);
      setSigner(s);
      setAccount(addr);
    } catch (e) {
      console.error("connectWallet error", e);
      setError(e.message || String(e));
    }
  };

  const decQty = () => setQuantity((q) => Math.max(1, q - 1));
  const incQty = () => setQuantity((q) => Math.min(20, q + 1));

  const handleMint = async () => {
    setError(null);
    setTxHash(null);

    if (!signer) {
      setError("Please connect wallet first");
      return;
    }

    setLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDR, ABI, signer);
      const nftContractArg = CONTRACT_ADDR;
      const feeRecipient = "0x0000000000000000000000000000000000000000";
      const minterIfNotPayer = await signer.getAddress();

      let value = 0n;
      if (priceEth) {
        const wei = ethers.parseEther(String(priceEth));
        value = wei * BigInt(quantity);
      }

      const tx = await contract.mintPublic(
        nftContractArg,
        feeRecipient,
        minterIfNotPayer,
        ethers.BigNumber.from(quantity),
        { value }
      );
      setTxHash(tx.hash || tx);
      await tx.wait();
      await loadSupply(); 
    } catch (e) {
      console.error("mint error", e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = useMemo(() => {
    if (totalMinted && maxSupply) {
      return Math.round((totalMinted / maxSupply) * 100);
    }
    return null;
  }, [totalMinted, maxSupply]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.hero}>
            <img
              src="/images/collection-hero.jpg"
              alt="collection"
              style={styles.heroImg}
            />
            <div style={styles.heroTitle}>Based Vice Toads</div>
          </div>

          <div style={{ marginTop: 18, textAlign: "center" }}>
            <div style={styles.progressBarWrap}>
              <div
                style={{
                  ...styles.progressBar,
                  width: progressPercent ? `${progressPercent}%` : "0%",
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>
              {collection && (
                <div
                  style={{ textAlign: "center", marginTop: 12 }}
                >
                  <img
                    src={collection.image_url}
                    alt="Collection"
                    width="120"
                    height="120"
                    style={{ borderRadius: 12, objectFit: "cover" }}
                  />
                  <h3 style={{ marginTop: 8, marginBottom: 8 }}>
                    {collection.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#dfe9ff",
                      maxHeight: 84,
                      overflow: "hidden",
                    }}
                  >
                    {collection.description}
                  </p>
                  <div style={{ marginTop: 8, color: "#dfe9ff" }}>
                    Floor price:{" "}
                    {collection.stats && collection.stats.floor_price
                      ? String(collection.stats.floor_price) + " ETH"
                      : "N/A"}
                  </div>
                </div>
              )}

              Total Minted: {totalMinted ?? "—"}{" "}
              {maxSupply ? `/ ${maxSupply}` : ""}
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            {!account ? (
              <button
                onClick={connectWallet}
                style={styles.connectBtn}
              >
                Connect wallet to see remaining mints
              </button>
            ) : (
              <div style={{ fontSize: 13, color: "#ddd" }}>
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </div>
            )}
          </div>

          <div style={styles.qtyRow}>
            <div style={{ color: "#fff", fontWeight: 600 }}>
              Quantity:
            </div>
            <div style={styles.qtyControls}>
              <button onClick={decQty} style={styles.qtyBtn}>
                −
              </button>
              <div style={styles.qtyVal}>{quantity}</div>
              <button onClick={incQty} style={styles.qtyBtn}>
                +
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              onClick={handleMint}
              disabled={loading}
              style={styles.mintBtn}
            >
              {loading
                ? "Minting..."
                : `MINT ${quantity} NFT${quantity > 1 ? "s" : ""}`}
            </button>
            {priceEth && (
              <div style={{ marginTop: 8, color: "#bbb" }}>
                Price: {priceEth} ETH each
              </div>
            )}
            {txHash && (
              <div
                style={{ marginTop: 8, color: "#9ef", fontSize: 13 }}
              >
                Tx:{" "}
                <a
                  style={{ color: "#9ef" }}
                  target="_blank"
                  rel="noreferrer"
                  href={`https://etherscan.io/tx/${txHash}`}
                >
                  {txHash}
                </a>
              </div>
            )}
            {error && (
              <div style={{ marginTop: 8, color: "#f99" }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#7fb1ff 0%, #d89bff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 520,
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 8px 30px rgba(2,6,23,0.6)",
    color: "#fff",
  },
  hero: {
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    textAlign: "center",
  },
  heroImg: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    filter: "brightness(0.9) saturate(1.1)",
  },
  heroTitle: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 12,
    background: "rgba(0,0,0,0.45)",
    padding: "6px 12px",
    borderRadius: 6,
    fontWeight: 800,
    letterSpacing: 1,
  },
  progressBarWrap: {
    height: 12,
    width: "100%",
    background: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background:
      "linear-gradient(90deg,#d08f3f,#b45fef)",
  },
  connectBtn: {
    background: "#5b6cff",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  },
  qtyRow: {
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 18,
    cursor: "pointer",
  },
  qtyVal: {
    minWidth: 36,
    textAlign: "center",
    fontWeight: 800,
    fontSize: 16,
  },
  mintBtn: {
    marginTop: 8,
    width: "100%",
    background: "#fff",
    color: "#000",
    border: "none",
    padding: "12px 18px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 16,
  },
};
