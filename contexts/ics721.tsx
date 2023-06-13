import axios from 'axios'
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { toBase64, toUtf8 } from "@cosmjs/encoding";
import {
  availableNetworks,
  getBridgeContractsForChainId,
} from './connections'
import {
  getHttpUrl,
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

export interface IBCTransferMsg {
  receiver: string
  channel_id: string
  timeout: {
    block: {
      revision: number
      height: number
    }
  }
}

export interface ICS721SendNFT {
  send_nft: {
    contract: string
    token_id: string
    msg: string
  }
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

export const queryNftContractMsg = (class_id: string) => {
  return { nft_contract: { class_id } }
}

export const queryNftContractsMsg = (start_after?: string, limit?: number) => {
  return { nft_contracts: { start_after, limit } }
}

export const queryNftOwnerTokensMsg = (owner: string) => {
  return { tokens: { owner } }
}

export const queryNftTokenInfoMsg = (token_id: string) => {
  return { all_nft_info: { token_id } }
}

export async function getMsgSendIcsNft(client: CosmWasmClient, options: MsgSendIcsOptions): Promise<ICS721SendNFT> {
  // TODO: Get current height on sending client chain

  const ibcTransferMsg: IBCTransferMsg = {
    receiver: options.receiver,
    channel_id: options.channel_id,
    timeout: {
      block: {
        revision: 1,
        height: 0
      }
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
  console.log('bridgeContracts', chain_id, bridgeContracts)

  // Query each bridge for its NFT contracts
  await Promise.all(bridgeContracts.map(addr => {
    console.log('---- clients[chain_id]', chain_id, client)
    try {
      return client.queryContractSmart(addr, queryNftContractsMsg())
    } catch (e) {
      console.log('bridgeContracts NFT contract getter e', e)
      return Promise.reject(e)
    }
  })).then(contractAddresses => {
    contractAddresses.forEach(contract_addr => {
      console.log('contract_addr', contract_addr)
      // a tuple is returns
      if (contract_addr) contract_addr.forEach((ca: string[]) => {
        if (ca[1] && !nftContracts.includes(ca[1])) nftContracts.push(ca[1])
      })
    })
  })
  .catch(error => console.log(error));
  console.log('getNftOwnerTokens nftContracts', JSON.stringify(nftContracts))

  const nftOwnerTokenIds = await Promise.all(nftContracts.map(nft => {
    try {
      return client.queryContractSmart(nft, queryNftOwnerTokensMsg(ownerAddress))
    } catch (e) {
      console.log('bridgeContracts NFT contract getter e', e)
      return Promise.reject(e)
    }
  }))
  .catch(error => console.log(error));

  nftOwnerTokenIds.forEach((data: any, idx: number) => {
    console.log('queryNftOwnerTokensMsg data', data);
    if (data?.tokens && data.tokens.length > 0) {
      if (!nftHoldings[nftContracts[idx]]) nftHoldings[nftContracts[idx]] = []
      data.tokens.forEach(tokenId => {
        if (!nftHoldings[nftContracts[idx]].includes(tokenId)) nftHoldings[nftContracts[idx]].push(tokenId)
      })
    }
  })

  console.log('nftHoldings', nftHoldings)
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
  console.log('nft_token_info', nft_token_info)

  nft_token_info.forEach(ti => {
    const tokenUri = ti.info && ti.info.token_uri ? ti.info.token_uri : null
    if (tokenUri) p3.push(axios.get(getHttpUrl(tokenUri)).then(({ data }) => data))
  })

  const nft_token_data = await Promise.all(p3)
  console.log('nft_token_data', nft_token_data)

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
  console.log('clientsclientsclients', Object.keys(clients), clients)
  console.log('addressesaddressesaddresses', Object.keys(addresses), addresses)
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