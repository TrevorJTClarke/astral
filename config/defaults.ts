import { assets, chains } from 'chain-registry';
import { AssetList, Asset, Chain } from '@chain-registry/types';
import { fromBech32 } from "@cosmjs/encoding";
import BigNumber from 'bignumber.js';

export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export const networkType: string = process.env.NEXT_NETWORK_TYPE ?? 'testnet';;
// export const chainName = process.env.NEXT_PUBLIC_CHAIN ?? 'stargaze';;
export const chainName = process.env.NEXT_PUBLIC_CHAIN ?? 'stargazetestnet';;

export const chainassets: AssetList = assets.find(
  (chain) => chain.chain_name === chainName
) as AssetList;

export const coin: Asset = chainassets.assets.find(
  (asset) => asset.base === 'ustars'
) as Asset;

export const exponent = coin.denom_units.find(
  (unit) => unit.denom === coin.display
)?.exponent as number;

export const toDisplayAmount = (amount: string, exponent: number) => {
  return new BigNumber(amount).shiftedBy(-exponent).decimalPlaces(2).toString();
};

export const getHttpUrl = (ipfsLink: string | undefined) => {
  if (!ipfsLink) return '';
  return `https://ipfs-gw.stargaze-apis.com/ipfs/${ipfsLink.slice(7)}`;
};

export const getChainForAddress = (address: string): Chain | undefined => {
  const { prefix } = fromBech32(address)
  return chains.find((chain) => chain.bech32_prefix === prefix && chain.network_type === networkType)
}

export const getChainByChainId = (chainId: string): Chain | undefined => {
  return chains.find((chain) => chain.chain_id === chainId && chain.network_type === networkType)
}

export const getChainAssets = (chain: Chain): AssetList => {
  return assets.find(
    (a) => a.chain_name === chain.chain_name || a.chain_name === `${chain.chain_name}`.replace('testnet', '')
  ) as AssetList;
}

export const marketInfo = [
  {
    chain_name: 'stargaze',
    name: 'Stargaze Marketplace',
    logoPath: '/stargaze.svg',
    marketLink: 'https://app.stargaze.zone/marketplace',
    marketDetailLink: () => '',
  },
  {
    chain_name: 'omniflix',
    name: 'Omniflix Marketplace',
    logoPath: '/omniflix.svg',
    marketLink: 'https://omniflix.market/home',
    marketDetailLink: () => '',
  },
  {
    chain_name: 'uptick',
    name: 'Uptick Marketplace',
    logoPath: '/uptick.svg',
    marketLink: 'https://uptick.upticknft.com/index',
    marketDetailLink: () => '',
  },
  {
    chain_name: 'juno',
    name: 'Neta DAO Marketplace',
    logoPath: '/netadao.png',
    marketLink: 'https://nft.netadao.zone/collections',
    marketDetailLink: () => '',
  },
  {
    chain_name: 'juno',
    name: 'Loop Marketplace',
    logoPath: '/loop.svg',
    marketLink: 'https://www.loop.markets/',
    marketDetailLink: () => '',
  },
]

export const getMarketForAddress = (address: string) => {
  if (!address || address.length < 10) return;
  const chain = getChainForAddress(address)
  if (!chain) return;
  return marketInfo.find((m) => chain?.chain_name === chain?.chain_name)
}