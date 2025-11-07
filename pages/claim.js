import React, { useState } from 'react';

export default function ClaimPage() {
  const [msg, setMsg] = useState('');
  async function doClaim() {
    setMsg('Connecting to backend...');
    // In production: obtain accountAssociation from Base/Farcaster runtime.
    // For testing: paste accountAssociation JSON (header,payload,signature).
    const sample = prompt('Paste JSON accountAssociation (header,payload,signature) for testing:');
    if (!sample) return setMsg('Cancelled');
    let assoc;
    try {
      assoc = JSON.parse(sample);
    } catch(e) { return setMsg('Invalid JSON') }
    setMsg('Sending claim...');
    try {
      const r = await fetch('/api/claim', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ accountAssociation: assoc })
      });
      const j = await r.json();
      if (!r.ok) return setMsg('Failed: ' + (j.error||JSON.stringify(j)));
      setMsg('Success! Total points: ' + j.totalPoints);
    } catch(e) {
      setMsg('Error: ' + e.message);
    }
  }
  return (
    <div style={{padding:20}}>
      <h2>Daily Claim Points</h2>
      <p>Only holders of the Based Vice Toads NFT can claim.</p>
      <button onClick={doClaim}>Claim (test - requires accountAssociation)</button>
      <div style={{marginTop:10}}>{msg}</div>
    </div>
  )
}
