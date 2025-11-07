import React, {useEffect, useState} from 'react';
export default function ProfilePage(){
  const [info, setInfo] = useState(null);
  useEffect(()=> {
    async function load(){
      const r = await fetch('/api/profile');
      const j = await r.json();
      setInfo(j);
    }
    load();
  },[]);
  return (
    <div style={{padding:20}}>
      <h2>Profile (demo)</h2>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}
