import { AssetList, Asset, Chain } from '@chain-registry/types';
import {
  networkType,
  getChainAssets,
  getChainByChainId,
} from '../config'

export interface NFTChannel {
  chain_id: string
  port: string
  channel: string
}

export interface NFTConnection {
	[key: string]: NFTChannel
}

export interface NFTChannelChain extends NFTChannel {
	chain?: Chain
	asset?: Asset
}

export interface NFTConnectionChain extends NFTConnection {
	[key: string]: NFTChannelChain
}

// export interface NFTConnections {
// 	[key string]: NFTConnection[]
// }

export const mainnetConnections: NFTConnection[] = [
  // {
	// 	channel_a: {
	// 		chain_id: "gon-irishub-1",
	// 		port:    "nft-transfer",
	// 		channel: "channel-22",
	// 	},
	// 	channel_b: {
	// 		chain_id: "elgafar-1",
	// 		port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
	// 		channel: "channel-207",
	// 	},
	// },
]

export const testnetConnections: NFTConnection[] = [
	{
		channel_a: {
			chain_id: "elgafar-1",
			port: "wasm.stars1qpl2xtwgrlnhg7c5f56tn8sgru53yxae8qx6zcxcz40fnfa9vk2sypwh0e",
			channel: "channel-468",
		},
		channel_b: {
			chain_id: "uni-6",
			port: "wasm.juno17f8seg2s7vekzjf9u340krujcvyx3sqrj6ggcukhp9dyv64hhdxqkm4frn",
			channel: "channel-443",
		},
	},
  // {
	// 	channel_a: {
	// 		chain_id: "gon-irishub-1",
	// 		port:    "nft-transfer",
	// 		channel: "channel-22",
	// 	},
	// 	channel_b: {
	// 		chain_id: "elgafar-1",
	// 		port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
	// 		channel: "channel-207",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "gon-irishub-1",
	// 		port:    "nft-transfer",
	// 		channel: "channel-24",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uni-6",
	// 		port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
	// 		channel: "channel-89",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "gon-irishub-1",
	// 		port:    "nft-transfer",
	// 		channel: "channel-17",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uptick_7000-2",
	// 		port:    "nft-transfer",
	// 		channel: "channel-3",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
	// 		channel: "channel-230",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uni-6",
	// 		port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
	// 		channel: "channel-120",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
	// 		channel: "channel-203",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uptick_7000-2",
	// 		port:    "nft-transfer",
	// 		channel: "channel-6",
	// 	},
	// },
]

export const connections: NFTConnections = {
  testnet: testnetConnections,
  mainnet: mainnetConnections,
}

export const connectionChannels = connections[`${networkType}`]
const networkMap: any = {}
export const extendedChannels: NFTConnectionChain[] = []

// use known connections to filter available chains
connectionChannels.forEach((channels: NFTChannel) => {
  const connection: NFTConnectionChain = {}
  Object.keys(channels).forEach((cid: string) => {
    const chain_id = channels[cid].chain_id
    const network = getChainByChainId(chain_id)
    let asset: Asset | null;
    if (network) {
      const assetList = getChainAssets(network)
      asset = assetList?.assets ? assetList.assets[0] : null
      connection[cid] = { ...channels[cid], asset, chain: network }
    }
    if (!networkMap[chain_id] && network) networkMap[chain_id] = { ...network, asset }
  })

  if (Object.keys(connection).length > 0) extendedChannels.push(connection)
})

export const availableNetworks: Chain[] | undefined = Object.values(networkMap)

export const isAvailableNetwork = (chain_id: string) => (availableNetworks.find(n => n.chain_id === chain_id) !== undefined)

export const getContractFromPort = (port: string) => `${port}`.search('wasm') > -1 ? `${port}`.split('.')[1] : undefined

export const getBridgeContractsForChainId = (chain_id: string): string[] => {
  const contractAddresses: string[] = []

  connectionChannels.forEach((channels: NFTConnectionChain) => {
    Object.keys(channels).forEach((cid: string) => {
      if (chain_id != channels[cid].chain_id) return;
      const port = channels[cid].port
			const contract_addr = getContractFromPort(port)
      if (contract_addr && !contractAddresses.includes(contract_addr)) contractAddresses.push(contract_addr)
    })
  })

  return contractAddresses
}

export const isBridgeAddress = (addr: string): boolean => {
  let isBridge = false

  connectionChannels.forEach((channels: NFTConnectionChain) => {
    Object.keys(channels).forEach((cid: string) => {
      const port = channels[cid].port
			if (`${port}`.search(addr) > -1) isBridge = true
    })
  })

	return isBridge
}