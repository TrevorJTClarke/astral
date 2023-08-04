import '../styles/globals.css';
import 'focus-visible'
import Head from 'next/head';
import type { AppProps } from 'next/app';
import { Header, Footer } from '../components';
import { defaultTheme, ChainProvider } from '@cosmos-kit/react';
import { RainbowKitProvider, darkTheme, lightTheme, getDefaultWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';
import { wallets as keplrWallets } from '@cosmos-kit/keplr';
import { wallets as cosmostationWallets } from '@cosmos-kit/cosmostation';
import { wallets as leapWallets } from '@cosmos-kit/leap';
import { GasPrice } from '@cosmjs/stargate';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { getSigningCosmosClientOptions } from 'stargazejs';

import { TailwindModal } from '../components';
import { networkType } from '../config';
import { ThemeProvider } from '../contexts/theme';

import { SignerOptions } from '@cosmos-kit/core';
import { chains, assets } from 'chain-registry';
import { Chain } from '@chain-registry/types';

const client = new ApolloClient({
  uri: networkType === 'testnet'
    ? 'https://constellations-api.testnet.stargaze-apis.com/graphql'
    : 'https://constellations-api.mainnet.stargaze-apis.com/graphql',
  cache: new InMemoryCache(),
});

const defaultGasForChain = (chain: Chain) => {
  let gasPrice: any = `0.04${chain.bech32_prefix}`
  if (chain?.fees && chain?.fees.fee_tokens) {
    const fee = chain?.fees.fee_tokens[0]
    const feeDenom = `${fee.denom}`.search('ibc/') === -1 ? `${fee.denom}` : fee.denom
    const feeUnit = `${fee.high_gas_price || fee.average_gas_price || fee.low_gas_price || fee.fixed_min_gas_price || 0}${feeDenom}`
    try {
      gasPrice = GasPrice.fromString(feeUnit)
    } catch (e) {
      // console.error(e)
    }
  }
  return { gasPrice };
}

// const { chains, publicClient } = configureChains(
const evmConfigs = configureChains(
  [mainnet],
  [
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_API_KEY_INFURA || '' }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Astral',
  projectId: process.env.NEXT_PUBLIC_API_KEY_WALLETCONNECT || '',
  chains: evmConfigs.chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient: evmConfigs.publicClient,
})

function AstralApp({ Component, pageProps }: AppProps) {
  const signerOptions: SignerOptions = {
    signingStargate: defaultGasForChain,
    signingCosmwasm: defaultGasForChain,
  };

  return (
    <ChainProvider
      chains={chains}
      assetLists={assets}
      wallets={[...keplrWallets, ...cosmostationWallets, ...leapWallets]}
      walletConnectOptions={{
        signClient: {
          projectId: process.env.NEXT_PUBLIC_API_KEY_WALLETCONNECT || 'a8510432ebb71e6948cfd6cde54b70f7',
          relayUrl: 'wss://relay.walletconnect.org',
          metadata: {
            name: 'Astral',
            description: 'NFT Bridge',
            url: 'https://stargaze.zone/',
            icons: [],
          },
        },
      }}
      wrappedWithChakra={false}
      signerOptions={signerOptions}
      walletModal={TailwindModal}
    >
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={evmConfigs.chains} theme={darkTheme({
          accentColor: '#db2777',
          accentColorForeground: 'white',
          borderRadius: 'medium',
          overlayBlur: 'small',
        })}>
          <ThemeProvider>
            <Head>
              <title>Astral :: Interchain NFTs</title>
              <meta name="description" content="Your bridge in the vast expanse of the blockchain universe. Use Astral for smooth transfers, transparent provenance and powerful NFT tools in the next chapter of the NFT revolution." />
              <link rel="icon" href="/favicon.ico" />
            </Head>
            <ApolloProvider client={client}>
              <div className="min-h-screen text-black bg-white dark:bg-black dark:text-white">
                <Header />
                <Component {...pageProps} />
                <Footer />
              </div>
            </ApolloProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </ChainProvider>
  );
}

export default AstralApp;
