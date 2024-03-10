import { assets, chains } from 'chain-registry';
import { AssetList, Asset, Chain } from '@chain-registry/types';
import { fromBech32 } from "@cosmjs/encoding";
import BigNumber from 'bignumber.js';

export const disallowedNFTFormats = [
  'text/plain',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
]

export const ethereummainnet = {
  chain_id: 'ethereummainnet',
  chain_name: 'ethereum',
  pretty_name: 'Ethereum',
  bech32_prefix: '0x',
  status: '',
  network_type: 'mainnet',
  slip44: 0,
  asset: {
    base: '0x',
    name: 'Ethereum',
    display: 'ethereum',
    symbol: 'ETH',
    denom_units: [
      {
        denom: 'Ether',
        exponent: 18,
        aliases: ['ETH', 'eth']
      }
    ],
    logo_URIs: {
      // svg: '',
      png: '/logos/ethereum-logo.png',
    },
  },
}

export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

export const networkType: string = process.env.NEXT_NETWORK_TYPE ?? 'mainnet';;
export const chainName = process.env.NEXT_PUBLIC_CHAIN ?? 'stargaze';;
// export const networkType: string = process.env.NEXT_NETWORK_TYPE ?? 'testnet';;
// export const chainName = process.env.NEXT_PUBLIC_CHAIN ?? 'stargazetestnet';;

export const excludedChainIds = ['columbus-5'];

export const filteredChains = chains.filter(chain => chain.network_type === networkType && !excludedChainIds.includes(chain.chain_id));

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

// TODO: Whats the right way to do this?
export const getHttpUrl = (ipfsLink: string | undefined) => {
  if (!ipfsLink || ipfsLink === 'undefined') return '';
  if (ipfsLink.startsWith('http')) return ipfsLink
  return `https://ipfs-gw.stargaze-apis.com/ipfs/${ipfsLink.slice(7)}`;
};

export const getChainForAddress = (address: string | undefined): Chain | undefined => {
  if (!address) return
  if (address.startsWith(ethereummainnet.bech32_prefix)) return
  let prefix 
  try {
    const bech = fromBech32(address)
    prefix = bech.prefix
  } catch (e) {
    return undefined
  }
  return filteredChains.find((chain) => chain.bech32_prefix === prefix && chain.network_type === networkType)
}

export const getChainByChainId = (chainId: string): Chain | undefined => {
  return filteredChains.find((chain) => chain.chain_id === chainId && chain.network_type === networkType)
}

export const getChainAssets = (chain: Chain): AssetList => {
  return assets.find(
    (a) => a.chain_name === chain.chain_name || a.chain_name === `${chain.chain_name}`.replace('testnet', '')
  ) as AssetList;
}

export const getExplorerFromTxData = (data: any): any => {
  if (!data || !data.events || data.events.length < 1) return
  let chainAddress

  // check the tx logs for any address we can pull chain_id from bech32
  data.events.forEach(e => {
    if (e.type === 'wasm') {
      e.attributes.forEach(a => {
        if (a.key === '_contract_address') chainAddress = a.value
        if (a.key === 'sender' && !chainAddress) chainAddress = a.value
      })
    }
  })
  if (!chainAddress) return;

  // get the explorer link from chain details (if any)
  const chain = getChainForAddress(chainAddress)
  return chain?.explorers.length > 0 ? chain.explorers[0] : null
}

// tx_page: 'https://explorer.8ball.info/8ball/tx/${txHash}'
export const getExplorerUrlForTx = (tx_page: string, txHash: string): string => {
  return `${tx_page}`.replace('${txHash}', txHash)
}

export function getLogFromError(str) {
  const rgx = /log:(?:[a-zA-Z ])+/g
  const found = rgx.exec(`${str}`.toLowerCase())
  if (!found || found.length <= 0) return 'Transaction rejected by user'
  return `${found[0]}`.replace('log: ', '')
}

const marketInfos = [
  {
    chain_name: 'omniflix',
    name: 'Omniflix Marketplace',
    logoPath: '/omniflix.svg',
    marketLink: 'https://omniflix.market/home',
    marketDetailLink: (_, tokenId) => `https://omniflix.market/nft/${tokenId}`,
  },
  {
    chain_name: 'ethereum',
    name: 'Zora',
    logoPath: '/logos/zora.png',
    marketLink: 'https://zora.co',
    // https://zora.co/collect/eth:0xbdf1ee84d043ef317e3ba1e1f56dace695bf46a8/1
    marketDetailLink: (address, tokenId) => `https://zora.co/collect/eth:${address}/${tokenId}`,
  },
  {
    chain_name: 'uptick',
    name: 'Uptick Marketplace',
    logoPath: '/uptick.svg',
    marketLink: 'https://uptick.upticknft.com/marketplace',
    marketDetailLink: (address, tokenId, ownerId) => `https://uptick.upticknft.com/saledetail?nftAddress=${address}&nftId=${tokenId}&owner=${ownerId}`,
  },
  {
    chain_name: 'juno',
    name: 'Neta DAO Marketplace',
    logoPath: '/netadao.png',
    marketLink: 'https://nft.netadao.zone/collections',
    marketDetailLink: (address, tokenId) => `https://nft.netadao.zone/collections/${address}/${tokenId}`,
  },
  {
    chain_name: 'juno',
    name: 'Loop Marketplace',
    logoPath: '/loop.svg',
    marketLink: 'https://nft-juno.loop.markets/collections',
    marketDetailLink: (address, tokenId) => `https://nft-juno.loop.markets/nftDetail/${address}/${tokenId}`,
  },
]

if (networkType === 'testnet') {
  marketInfos.unshift({
    chain_name: 'stargazetestnet',
    name: 'Stargaze Marketplace',
    logoPath: '/stargaze.svg',
    marketLink: 'http://testnet.publicawesome.dev/marketplace',
    marketDetailLink: (address, tokenId) => `http://testnet.publicawesome.dev/marketplace/${address}/${tokenId}`,
  })
  marketInfos.push({
    chain_name: 'terra2testent',
    name: 'Talis Marketplace',
    logoPath: '/logos/talis.svg',
    marketLink: 'https://talis.art/marketplace',
    marketDetailLink: (address, tokenId) => `https://talis.art/nft/${tokenId}`,
  })
} else {
  marketInfos.unshift({
    chain_name: 'stargaze',
    name: 'Stargaze Marketplace',
    logoPath: '/stargaze.svg',
    marketLink: 'https://stargaze.zone/marketplace',
    marketDetailLink: (address, tokenId) => `https://stargaze.zone/marketplace/${address}/${tokenId}`,
  })
  marketInfos.push({
    chain_name: 'terra2',
    name: 'Talis Marketplace',
    logoPath: '/logos/talis.svg',
    marketLink: 'https://cosmos.talis.art/marketplace',
    marketDetailLink: (address, tokenId) => `https://cosmos.talis.art/nft/${tokenId}`,
  })
}

export const marketInfo = marketInfos

export const getMarketForAddress = (address: string) => {
  if (!address || address.length < 10) return;
  const chain = address.startsWith(ethereummainnet.bech32_prefix)
    ? ethereummainnet
    : getChainForAddress(address)
  if (!chain) return;
  return marketInfo.find((m) => m?.chain_name === chain?.chain_name)
}