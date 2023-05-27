import '../styles/globals.css';
import Head from 'next/head';
import type { AppProps } from 'next/app';
import { Header, Footer } from '../components';
import { defaultTheme, ChainProvider } from '@cosmos-kit/react';
import { wallets as keplrWallets } from '@cosmos-kit/keplr';
import { wallets as cosmostationWallets } from '@cosmos-kit/cosmostation';
import { wallets as leapWallets } from '@cosmos-kit/leap';

import { TailwindModal } from '../components';
import { ThemeProvider } from '../contexts/theme';

import { SignerOptions } from '@cosmos-kit/core';
import { chains, assets } from 'chain-registry';

function AstralApp({ Component, pageProps }: AppProps) {
  const signerOptions: SignerOptions = {
    // signingStargate: (_chain: Chain) => {
    //   return getSigningCosmosClientOptions();
    // }
  };

  return (
    <ChainProvider
      chains={chains}
      assetLists={assets}
      wallets={[...keplrWallets, ...cosmostationWallets, ...leapWallets]}
      walletConnectOptions={{
        signClient: {
          projectId: 'a8510432ebb71e6948cfd6cde54b70f7',
          relayUrl: 'wss://relay.walletconnect.org',
          metadata: {
            name: 'Astral',
            description: 'NFT Bridge',
            url: 'https://stargaze.zone/',
            icons: [],
          },
        },
      }}
      wrappedWithChakra={true}
      signerOptions={signerOptions}
      walletModal={TailwindModal}
    >
      <ThemeProvider>
        <Head>
          <title>Astral - NFT Bridge</title>
          <meta name="description" content="Easily bridge cosmos NFTs with ICS721" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="min-h-screen text-black bg-white dark:bg-black dark:text-white">
          <Header />
          <Component {...pageProps} />
          <Footer />
        </div>

      </ThemeProvider>
    </ChainProvider>
  );
}

export default AstralApp;
