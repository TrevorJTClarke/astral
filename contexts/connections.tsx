import { AssetList, Asset, Chain } from '@chain-registry/types';
import {
  networkType,
  getChainAssets,
  getChainByChainId,
	ethereummainnet,
} from '../config'

export const walletProxyList = {
	'keplr-extension': 'keplr',
	'keplr-mobile': 'keplr',
	'cosmostation-extension': 'cosmostation',
	'cosmostation-mobile': 'cosmostation',
	'walletconnect': 'walletconnectv2',
	'🌈 rainbow': 'rainbowwallet',
	'🌈rainbow': 'rainbowwallet',
	'rainbow': 'rainbowwallet',
}

export const walletConfigs = {
	coinbasewallet: {
		name: 'Coinbase Wallet',
		logoUrl: '/logos/coinbasewallet.svg',
	},
	cosmostation: {
		name: 'Cosmostation',
		logoUrl: '/logos/cosmostation.png',
	},
	keplr: {
		name: 'Keplr',
		logoUrl: '/logos/keplr.svg',
	},
	leap: {
		name: 'Leap Wallet',
		logoUrl: '/logos/leap.png',
	},
	metamask: {
		name: 'MetaMask',
		logoUrl: '/logos/metamask.svg',
	},
	rainbowwallet: {
		name: '🌈 Rainbow',
		logoUrl: '/logos/rainbowwallet.svg',
	},
	walletconnectv2: {
		name: 'Wallet Connect',
		logoUrl: '/logos/walletconnect.svg',
	},
}

export const getWalletConfigById = (id: string) => {
	if (walletConfigs[id]) return walletConfigs[id]
	if (walletConfigs[walletProxyList[id]]) return walletConfigs[walletProxyList[id]]
}

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
	{
		channel_a: {
			chain_id: "stargaze-1",
			port: "wasm.stars1r0a8ygvnjfaegy4n5z9325e0ew9uy2s7rn4vt7qf4ltv49fj4tnsk6pvtv",
			channel: "channel-243",
		},
		channel_b: {
			chain_id: "juno-1",
			port: "wasm.juno1kc0lcysppht7s8xl263q208u2t7epw5h3zvhyscsxjlz560yysmsrd8ydt",
			channel: "channel-421",
		},
	},
	{
		channel_a: {
			chain_id: "stargaze-1",
			port: "wasm.stars1r0a8ygvnjfaegy4n5z9325e0ew9uy2s7rn4vt7qf4ltv49fj4tnsk6pvtv",
			channel: "channel-282",
		},
		channel_b: {
			chain_id: "phoenix-1",
			port: "wasm.terra1ed3qw4y4ca3lpj82ugg2jqsjr9czd0yyldcpp5n5yd7hu6udqafslz0nmg",
			channel: "channel-370",
		},
	},
	{
		channel_a: {
			chain_id: "phoenix-1",
			port: "wasm.terra1ed3qw4y4ca3lpj82ugg2jqsjr9czd0yyldcpp5n5yd7hu6udqafslz0nmg",
			channel: "channel-326",
		},
		channel_b: {
			chain_id: "juno-1",
			port: "wasm.juno1kc0lcysppht7s8xl263q208u2t7epw5h3zvhyscsxjlz560yysmsrd8ydt",
			channel: "channel-463",
		},
	},
	// {
	// 	channel_a: {
	// 		chain_id: "stargaze-1",
	// 		port: "wasm.stars1r0a8ygvnjfaegy4n5z9325e0ew9uy2s7rn4vt7qf4ltv49fj4tnsk6pvtv",
	// 		channel: "channel-271",
	// 	},
	// 	channel_b: {
	// 		chain_id: "xstaxy-1",
	// 		port: "wasm.aura1ezngmms9pzsuep7w4llvnq4wgr7cy8dk066yj6w30lej5gfxm36snnnr2a",
	// 		channel: "channel-24",
	// 	},
	// },
]

// Examples:
// {
// 	channel_a: {
// 		chain_id: "gon-irishub-1", //"uptick_7000-2"
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
// 		chain_id: "elgafar-1",
// 		port: "wasm.stars1qpl2xtwgrlnhg7c5f56tn8sgru53yxae8qx6zcxcz40fnfa9vk2sypwh0e",
// 		channel: "channel-468",
// 	},
// 	channel_b: {
// 		chain_id: "uni-6",
// 		port: "wasm.juno17f8seg2s7vekzjf9u340krujcvyx3sqrj6ggcukhp9dyv64hhdxqkm4frn",
// 		channel: "channel-443",
// 	},
// },
// 
// 
// NOTE: You do not need to specify the inverse, code will pick it up in logic
export const testnetConnections: NFTConnection[] = [
	// NOTE: Old-----
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port: "wasm.stars1a7mszjlnfkzy7gnmvwzlapuxpf52su648079jumlzszw6y8fqd9qkfh8zj",
	// 		channel: "channel-504",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uni-6",
	// 		port: "wasm.juno1ga6anf5zj7fnx6gj5e43wkqwh8lf8zu0dkcd277grghp2gsapjpqh65dfj",
	// 		channel: "channel-552",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port: "wasm.stars1a7mszjlnfkzy7gnmvwzlapuxpf52su648079jumlzszw6y8fqd9qkfh8zj",
	// 		channel: "channel-505",
	// 	},
	// 	channel_b: {
	// 		chain_id: "pisco-1",
	// 		port: "wasm.terra1r4mqmqxu4we35nfszgv3ksctxtjhv7v5j35gml6dfjeey35hg74qx4ffxf",
	// 		channel: "channel-299",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "uni-6",
	// 		port: "wasm.juno1ga6anf5zj7fnx6gj5e43wkqwh8lf8zu0dkcd277grghp2gsapjpqh65dfj",
	// 		channel: "channel-553",
	// 	},
	// 	channel_b: {
	// 		chain_id: "pisco-1",
	// 		port: "wasm.terra1r4mqmqxu4we35nfszgv3ksctxtjhv7v5j35gml6dfjeey35hg74qx4ffxf",
	// 		channel: "channel-298",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port: "wasm.stars166xr8hy2t6tmzufnjpc6psnm3apgdk8lkayksu4qg4nxkdwr3gvs98wh7h",
	// 		channel: "channel-515",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uni-6",
	// 		port: "wasm.juno1wk9te824s2as29qntdxtcs6fn8y350g6exuw7hldmrrwze6y6ugse8ulfa",
	// 		channel: "channel-583",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port: "wasm.stars1ytu7kwcmkn0qhm2r229d3zdhzuscekae8xncddy34pzyz9956jaq8auqn6",
	// 		channel: "channel-524",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uni-6",
	// 		port: "wasm.juno1dk49cyz7q7vr3san6l955pkd9uf8j2c2gkfgjyvx8tdfuplws98qfl556k",
	// 		channel: "channel-591",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port: "wasm.stars165fr5j3ea0dk5yr5sr4h8uw76z5fd34lpnqc2x80ya9xkx9u0k3qjrqpzq",
	// 		channel: "channel-553",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uni-6",
	// 		port: "wasm.juno1uvflayc34fs9r3tzcausztks2058ecpt5kqtzf3sz5kwnu7fjtfqn7zmtj",
	// 		channel: "channel-651",
	// 	},
	// },

	// old channels, valid contracts
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port: "wasm.stars165fr5j3ea0dk5yr5sr4h8uw76z5fd34lpnqc2x80ya9xkx9u0k3qjrqpzq",
	// 		channel: "channel-580",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uni-6",
	// 		port: "wasm.juno1uvflayc34fs9r3tzcausztks2058ecpt5kqtzf3sz5kwnu7fjtfqn7zmtj",
	// 		channel: "channel-705",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "elgafar-1",
	// 		port: "wasm.stars165fr5j3ea0dk5yr5sr4h8uw76z5fd34lpnqc2x80ya9xkx9u0k3qjrqpzq",
	// 		channel: "channel-581",
	// 	},
	// 	channel_b: {
	// 		chain_id: "pisco-1",
	// 		port: "wasm.terra1luhy2ngj7y0lqy3vjek3xm777pywptzzea0sc5ymu4pmafjrn07s5rlmxt",
	// 		channel: "channel-345",
	// 	},
	// },
	// {
	// 	channel_a: {
	// 		chain_id: "pisco-1",
	// 		port: "wasm.terra1luhy2ngj7y0lqy3vjek3xm777pywptzzea0sc5ymu4pmafjrn07s5rlmxt",
	// 		channel: "channel-344",
	// 	},
	// 	channel_b: {
	// 		chain_id: "uni-6",
	// 		port: "wasm.juno1uvflayc34fs9r3tzcausztks2058ecpt5kqtzf3sz5kwnu7fjtfqn7zmtj",
	// 		channel: "channel-706",
	// 	},
	// },
	{
		channel_a: {
			chain_id: "elgafar-1",
			port: "wasm.stars165fr5j3ea0dk5yr5sr4h8uw76z5fd34lpnqc2x80ya9xkx9u0k3qjrqpzq",
			channel: "channel-589",
		},
		channel_b: {
			chain_id: "uni-6",
			port: "wasm.juno1uvflayc34fs9r3tzcausztks2058ecpt5kqtzf3sz5kwnu7fjtfqn7zmtj",
			channel: "channel-721",
		},
	},
	{
		channel_a: {
			chain_id: "elgafar-1",
			port: "wasm.stars165fr5j3ea0dk5yr5sr4h8uw76z5fd34lpnqc2x80ya9xkx9u0k3qjrqpzq",
			channel: "channel-590",
		},
		channel_b: {
			chain_id: "pisco-1",
			port: "wasm.terra1luhy2ngj7y0lqy3vjek3xm777pywptzzea0sc5ymu4pmafjrn07s5rlmxt",
			channel: "channel-354",
		},
	},
	{
		channel_a: {
			chain_id: "pisco-1",
			port: "wasm.terra1luhy2ngj7y0lqy3vjek3xm777pywptzzea0sc5ymu4pmafjrn07s5rlmxt",
			channel: "channel-353",
		},
		channel_b: {
			chain_id: "uni-6",
			port: "wasm.juno1uvflayc34fs9r3tzcausztks2058ecpt5kqtzf3sz5kwnu7fjtfqn7zmtj",
			channel: "channel-722",
		},
	},
]

export const connections = {
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

// Add ethereum context
networkMap.ethereummainnet = ethereummainnet

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

export const getDestChannelFromSrc = (src: NFTChannel | undefined): NFTChannel | undefined => {
	if (!src) return;
	let dest: NFTChannel | undefined;

	connectionChannels.forEach(c => {
		if (dest) return;
		if (c.channel_a.chain_id === src.chain_id && c.channel_a.port === src.port && c.channel_a.channel === src.channel) dest = c.channel_b
		if (c.channel_b.chain_id === src.chain_id && c.channel_b.port === src.port && c.channel_b.channel === src.channel) dest = c.channel_a
	})

	return dest
}