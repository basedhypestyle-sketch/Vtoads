import Link from 'next/link';
export default function Home() {
  return (
    <div style={{padding:20}}>
      <h1>Based Vice Toads — Mini App</h1>
      <ul>
        <li><Link href='/mint'>Mint</Link></li>
      </ul>
    </div>
  )
}
