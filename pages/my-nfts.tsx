import Head from 'next/head';
import { Header, Footer } from '../components';

export default function MyNfts() {
  const chainName = process.env.NEXT_PUBLIC_CHAIN ?? 'stargaze';

  return (
    <div>
      <Head>
        <title>Astral - NFT Bridge</title>
        <meta name="description" content="Easily bridge cosmos NFTs with ICS721" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <h2>My NFTs</h2>

      <Footer />

    </div>
  );
}
