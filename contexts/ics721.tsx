import axios from 'axios'
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { fromBech32, toBase64, toUtf8 } from "@cosmjs/encoding";
import {
  availableNetworks,
  getBridgeContractsForChainId,
} from './connections'
import {
  getHttpUrl,
  getChainForAddress,
} from '../config'

// example; 'p6/c6/p4/c4/p2/c2/nftClass'
export function parseClassId(classId: string): string[][] {
  const regex = /([^\/]+)\/?([^\/]*)/g;
  let match;
  let pairs = [];

  while ((match = regex.exec(classId)) !== null) {
    pairs.push([match[1], match[2]].filter(Boolean));
  }

  return pairs;
}

export function joinClassId(parsedId: string[][] | undefined): string | undefined {
  if (!parsedId) return;
  return parsedId.reduce((pre, cur) => pre.concat(cur)).join('/')
}

export function getAddrFromPort(port: string): string {
  if (port.search('wasm') > -1) return port.split('.')[1]
  return port
}

export function isValidAddress(input: string, bech32_prefix?: string): boolean {
  if (!bech32_prefix) return `${input}`.length === 44
  try {
    const { prefix, data } = fromBech32(input);
    if (prefix !== bech32_prefix) {
      return false;
    }
    return data.length === 20;
  } catch {
    return false;
  }
}

export interface IBCTransferMsg {
  receiver: string
  channel_id: string
  timeout: {
    block?: {
      revision: number
      height: number
    }
    timestamp?: string
  }
}

export interface ICS721InvokeSendNFT {
  invoke_send_nft: {
    collection: string
    token_id: string
    msg: string
  }
}

export interface ICS721SendNFT {
  send_nft: {
    contract: string
    token_id: string
    msg: string
  }
}

export interface ICS721ApproveProxy {
  approve: {
    spender: string
    token_id: string
    expires: {
      at_time: string
    }
  }
}

export interface MsgApproveIcsOptions {
  proxy_addr: string
  token_id: string
}

export interface MsgSendIcsOptions {
  channel_id: string
  contract: string
  token_id: string
  receiver: string
}

export interface QueryChainClients {
  [key: string]: CosmWasmClient
}
export interface QueryChainAddresses {
  [key: string]: string[]
}
export interface NftTokenContractData {
  attributes: any[]
  description: string
  external_url?: string
  image: string
  name: string
}
export interface NftTokenData extends NftTokenContractData {
  id: string
  collection_addr?: string
  imageUrl?: string
}

export const queryNftClassIdMsg = (contract: string) => {
  return { class_id: { contract } }
}

export const queryNftContractMsg = (class_id: string) => {
  return { nft_contract: { class_id } }
}

export const queryNftContractsMsg = (start_after?: string, limit?: number) => {
  return { nft_contracts: { start_after, limit } }
}

export const queryNftOwnerTokensMsg = (owner: string) => {
  return { tokens: { owner } }
}

export const queryNftOwnerOfMsg = (token_id: string) => {
  return { owner_of: { token_id } }
}

export const queryNftTokenInfoMsg = (token_id: string) => {
  return { all_nft_info: { token_id } }
}

export const queryICSIncomingBridgeProxy = () => {
  return { incoming_proxy: {} }
}

export const queryICSOutgoingBridgeProxy = () => {
  return { outgoing_proxy: {} }
}

export const queryICSBridgeIncomingChannels = (start_after?: string, limit?: number) => {
  return { incoming_channels: { start_after, limit } }
}

export const queryICSBridgeOutgoingChannels = (start_after?: string, limit?: number) => {
  return { outgoing_channels: { start_after, limit } }
}

export const queryICSProxyConfig = () => {
  return { get_config: {} }
}

export const queryICSProxyRateLimit = () => {
  return 'get_rate_limit'
}

export const queryICSProxyChannelWhitelist = () => {
  return { get_channels_whitelist: { limit: 100 } }
}

export const queryICSProxyCollectionWhitelist = () => {
  return { get_collections_whitelist: { limit: 100 } }
}

// 30mins from now, in nanos
export const getNowPlus30Mins = () => `${(+new Date() + (30 * 60 * 1000)) * 1000000}`

// Approve the transfer of an NFT via proxy before send
export function getMsgApproveIcsProxy(options: MsgApproveIcsOptions): ICS721ApproveProxy {
  return {
    approve: {
      // Spender is the proxy here, being approved to do so
      spender: options.proxy_addr,
      token_id: options.token_id,
      expires: {
        at_time: getNowPlus30Mins()
      }
    }
  }
}

// Approved Sender with wrapped IBC transfer message
export function getMsgProxySendIcsNft(options: MsgSendIcsOptions): ICS721InvokeSendNFT {
  const ibcTransferMsg: IBCTransferMsg = {
    receiver: options.receiver,
    channel_id: options.channel_id,
    timeout: {
      timestamp: getNowPlus30Mins()
    }
  }

  return {
    invoke_send_nft: {
      collection: options.contract,
      token_id: options.token_id,
      msg: toBase64(toUtf8(JSON.stringify(ibcTransferMsg)))
    }
  }
}

// Vanilla IBC transfer message
export function getMsgSendIcsNft(options: MsgSendIcsOptions): ICS721SendNFT {
  const ibcTransferMsg: IBCTransferMsg = {
    receiver: options.receiver,
    channel_id: options.channel_id,
    timeout: {
      timestamp: getNowPlus30Mins()
    }
  }

  return {
    send_nft: {
      contract: options.contract,
      token_id: options.token_id,
      msg: toBase64(toUtf8(JSON.stringify(ibcTransferMsg)))
    }
  }
}

export async function getNftOwnerTokensForClient(chain_id: string, client: CosmWasmClient, ownerAddress: string): Promise<NftTokenData> {
  const nftContracts: string[] = []
  const nftHoldings: QueryChainAddresses = {}
  const bridgeContracts = getBridgeContractsForChainId(chain_id)
  if (!bridgeContracts || bridgeContracts.length < 1) return;

  // Query each bridge for its NFT contracts
  await Promise.all(bridgeContracts.map(addr => {
    try {
      return client.queryContractSmart(addr, queryNftContractsMsg())
    } catch (e) {
      return Promise.reject(e)
    }
  })).then(contractAddresses => {
    contractAddresses.forEach(contract_addr => {
      // a tuple is returns
      if (contract_addr) contract_addr.forEach((ca: string[]) => {
        if (ca[1] && !nftContracts.includes(ca[1])) nftContracts.push(ca[1])
      })
    })
  })
  // .catch(error => console.log(error))
  if (!nftContracts || nftContracts.length < 1) return;

  const nftOwnerTokenIds = await Promise.all(nftContracts.map(nft => {
    try {
      return client.queryContractSmart(nft, queryNftOwnerTokensMsg(ownerAddress))
    } catch (e) {
      return Promise.reject(e)
    }
  }))
  // .catch(error => console.log(error))
  if (!nftOwnerTokenIds || nftOwnerTokenIds.length < 1) return;

  nftOwnerTokenIds.forEach((data: any, idx: number) => {
    if (data?.tokens && data.tokens.length > 0) {
      if (!nftHoldings[nftContracts[idx]]) nftHoldings[nftContracts[idx]] = []
      data.tokens.forEach(tokenId => {
        if (!nftHoldings[nftContracts[idx]].includes(tokenId)) nftHoldings[nftContracts[idx]].push(tokenId)
      })
    }
  })

  const p2: Promise<any> = []
  const p3: Promise<any> = []
  const nft_token_collection_idxs: string[] = []
  const nft_token_id_idxs: string[] = []

  Object.keys(nftHoldings).forEach((nft: string, idx: number) => {
    nftHoldings[nft].forEach(id => {
      if (id) {
        nft_token_collection_idxs.push(nft)
        nft_token_id_idxs.push(id)
        p2.push(client.queryContractSmart(nft, {
          all_nft_info: { token_id: id },
          // nft_info: { token_id: id },
        }))
      }
    })
  })

  const nft_token_info = await Promise.all(p2)
  if (!nft_token_info || nft_token_info.length < 1) return;

  nft_token_info.forEach(ti => {
    const tokenUri = ti.info && ti.info.token_uri ? ti.info.token_uri : null
    if (tokenUri) p3.push(axios.get(getHttpUrl(tokenUri)).then(({ data }) => data))
  })

  const nft_token_data = await Promise.all(p3)

  return nft_token_data.map((token: NftTokenContractData, idx: number) => {
    const d = {
      ...token,
      collection_addr: `${nft_token_collection_idxs[idx]}`,
      id: `${nft_token_id_idxs[idx]}`,
      imageUrl: token.image ? getHttpUrl(token.image) : '',
    }
    return d as NftTokenData
  })
}

export async function getNftOwnerTokens(clients: QueryChainClients, addresses: QueryChainAddresses): Promise<any[]> {
  let allNfts: any[] = []
  for await (const chain_id of Object.keys(addresses)) {
    for await (const address of addresses[chain_id]) {
      if (clients[chain_id]) {
        const nfts = await getNftOwnerTokensForClient(chain_id, clients[chain_id], address)
        allNfts = allNfts.concat(nfts)
      }
    }
  }
  return allNfts
}