import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { MINT_PUBLIC_ABI } from "../abi/mintPublicAbi";

const CONTRACT_ADDR = process.env.NEXT_PUBLIC_NFT_CONTRACT || "0xaaf5e6fdcd17dfe3e3975930126c28b2ad182cca";
const OPENSEA_COLLECTION = "https://opensea.io/collection/based-vice-toads/overview";
const COLLECTION_PAGE = "https://basevicetoads.base44.app/";

export default function MintPage() {
  const [quantity, setQuantity] = useState(1);
  const [feeRecipient, setFeeRecipient] = useState(""); 
  const [minterIfNotPayer, setMinterIfNotPayer] = useState(""); 
  const [payableEth, setPayableEth] = useState("0");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [assets, setAssets] = useState([]);
const [priceSource, setPriceSource] = useState(null);
const [autoPriceEth, setAutoPriceEth] = useState('0');
// load auto price from server
useEffect(()=>{
  async function loadPrice() {
    try {
      const r = await fetch(`/api/mint-price?contract=${CONTRACT_ADDR}`);
      const j = await r.json();
      if (j.ok) {
        setAutoPriceEth(String(j.priceEth));
        setPriceSource(j.source || 'contract');
      } else {
        setPriceSource('none');
      }
    } catch(e) { console.error('price load error', e); setPriceSource('error'); }
  }
  loadPrice();
}, []);



  useEffect(()=> {
    async function loadAssets(){
      try {
        const r = await fetch(`/api/opensea-assets?contract=${CONTRACT_ADDR}`);
        const j = await r.json();
        setAssets(j.assets || []);
      } catch(e) {
        console.error(e);
      }
    }
    loadAssets();
  }, []);

  async function connectProvider() {
    const w3 = new Web3Modal({ cacheProvider: true });
    const connection = await w3.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    return { provider, signer };
  }

  async function handleMint() {
    setError(null);
    setTxHash(null);
    setLoading(true);
    try {
      const { signer } = await connectProvider();
      const contract = new ethers.Contract(CONTRACT_ADDR, MINT_PUBLIC_ABI, signer);
      const feeRec = feeRecipient && ethers.utils.isAddress(feeRecipient) ? feeRecipient : "0x0000000000000000000000000000000000000000";
      const minterAlt = minterIfNotPayer && ethers.utils.isAddress(minterIfNotPayer) ? minterIfNotPayer : await signer.getAddress();
      const value = payableEth ? ethers.parseEther(String(payableEth)) : 0;
      const tx = await contract.mintPublic(CONTRACT_ADDR, feeRec, minterAlt, ethers.BigNumber.from(quantity), { value });
      setTxHash(tx.hash);
      await tx.wait();
      setLoading(false);
      alert("Mint successful: " + tx.hash);
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
      setLoading(false);
    }
  }

  return (
    <div style={{padding:20}}>
      <h1>Based Vice Toads — Mint</h1>
      <p>Mint directly from the browser or open the collection on OpenSea.</p>

      <div style={{marginTop:20}}>
        <div>Contract Address: <code>{CONTRACT_ADDR}</code></div>
        <div style={{marginTop:8}}>
          <label>Quantity</label>
          <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>
        <div>
          <label>Fee recipient (optional)</label>
          <input type="text" value={feeRecipient} onChange={e=>setFeeRecipient(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <label>Minter if not payer (optional)</label>
          <input type="text" value={minterIfNotPayer} onChange={e=>setMinterIfNotPayer(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <label>Payable ETH (auto-filled below)</label>
          <input type="text" value={payableEth} onChange={e=>setPayableEth(e.target.value)} />
        </div>

        <div style={{marginTop:12}}>
          <button onClick={handleMint} disabled={loading}> {loading ? 'Minting...' : 'Mint from Web' } </button>
          <a style={{marginLeft:8}} href={COLLECTION_PAGE} target="_blank">Open Collection</a>
          <a style={{marginLeft:8}} href={OPENSEA_COLLECTION} target="_blank">Open on OpenSea</a>
        </div>

        {txHash && <div>Tx: <a href={`https://etherscan.io/tx/${txHash}`} target="_blank">{txHash}</a></div>}
        {error && <div style={{color:'red'}}>Error: {error}</div>}

        <h3 style={{marginTop:20}}>OpenSea listing preview</h3>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:10}}>
          {assets.map(a => (
            <div key={a.id} style={{border:'1px solid #333', padding:8}}>
              <img src={a.image_preview_url || a.image_url} style={{width:'100%', height:120, objectFit:'cover'}} alt={a.name} />
              <div style={{fontSize:12}}>{a.name}</div>
              <div style={{fontSize:11, color:'#aaa'}}>#{a.token_id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
