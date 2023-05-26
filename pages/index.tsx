import Head from 'next/head';
import { Header, Footer } from '../components';

export default function Index() {
  const chainName = process.env.NEXT_PUBLIC_CHAIN ?? 'stargaze';

  return (
    <div>
      <Head>
        <title>Astral - NFT Bridge</title>
        <meta name="description" content="Easily bridge cosmos NFTs with ICS721" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className="max-w-5xl py-10 mx-6 lg:mx-auto">

        <div className="text-center">
          <h1 className="mb-6 text-center text-3xl font-semibold mt-16 xl:text-5xl">
            Astral
          </h1>
          <h1 className="text-2xl font-bold sm:text-3xl md:text-3xl">
            Interchain&nbsp;
            <span className="text-pink-600">
              NFT Bridge
            </span>
          </h1>
        </div>
        <div className="grid gap-8 mb-14 md:grid-cols-2 lg:grid-cols-3">
          Actions
        </div>
        <div className="grid gap-8 mb-20 md:grid-cols-2">
          NFTs
        </div>

      </div>

      <Footer />
      
    </div>
  );
}
