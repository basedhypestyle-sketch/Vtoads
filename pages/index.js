import Link from 'next/link';
export default function Home() {
  return (
    <div style={{padding:20}}>
      <h1>Based Vice Toads — Mini App</h1>
      <p>Claim daily points, mint NFTs, and redeem tokens.</p>
      <ul>
        <li><Link href='/claim'>Claim</Link></li>
        <li><Link href='/profile'>Profile</Link></li>
        <li><Link href='/mint'>Mint / Collection</Link></li>
      </ul>
    </div>
  )
}
