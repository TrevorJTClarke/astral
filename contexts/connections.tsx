export interface NFTChannel {
  chain_id: string
  port: string
  channel: string
}

export interface NFTConnection {
  channel_a: NFTChannel
  channel_b: NFTChannel
}

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
			chain_id: "gon-irishub-1",
			port:    "nft-transfer",
			channel: "channel-22",
		},
		channel_b: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-207",
		},
	},
	{
		channel_a: {
			chain_id: "gon-irishub-1",
			port:    "nft-transfer",
			channel: "channel-23",
		},
		channel_b: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-208",
		},
	},
	{
		channel_a: {
			chain_id: "gon-irishub-1",
			port:    "nft-transfer",
			channel: "channel-24",
		},
		channel_b: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-89",
		},
	},
	{
		channel_a: {
			chain_id: "gon-irishub-1",
			port:    "nft-transfer",
			channel: "channel-25",
		},
		channel_b: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-90",
		},
	},
	{
		channel_a: {
			chain_id: "gon-irishub-1",
			port:    "nft-transfer",
			channel: "channel-17",
		},
		channel_b: {
			chain_id: "uptick_7000-2",
			port:    "nft-transfer",
			channel: "channel-3",
		},
	},
	{
		channel_a: {
			chain_id: "gon-irishub-1",
			port:    "nft-transfer",
			channel: "channel-19",
		},
		channel_b: {
			chain_id: "uptick_7000-2",
			port:    "nft-transfer",
			channel: "channel-4",
		},
	},
	{
		channel_a: {
			chain_id: "gon-irishub-1",
			port:    "nft-transfer",
			channel: "channel-0",
		},
		channel_b: {
			chain_id: "gon-flixnet-1",
			port:    "nft-transfer",
			channel: "channel-24",
		},
	},
	{
		channel_a: {
			chain_id: "gon-irishub-1",
			port:    "nft-transfer",
			channel: "channel-1",
		},
		channel_b: {
			chain_id: "gon-flixnet-1",
			port:    "nft-transfer",
			channel: "channel-25",
		},
	},
	{

		channel_a: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-230",
		},
		channel_b: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-120",
		},
	},
	{
		channel_a: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-234",
		},
		channel_b: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-122",
		},
	},
	{

		channel_a: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-211",
		},
		channel_b: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-93",
		},
	},
	{
		channel_a: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-213",
		},
		channel_b: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-94",
		},
	},
	{
		channel_a: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-203",
		},
		channel_b: {
			chain_id: "uptick_7000-2",
			port:    "nft-transfer",
			channel: "channel-6",
		},
	},
	{
		channel_a: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-206",
		},
		channel_b: {
			chain_id: "uptick_7000-2",
			port:    "nft-transfer",
			channel: "channel-12",
		},
	},
	{
		channel_a: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-209",
		},
		channel_b: {
			chain_id: "gon-flixnet-1",
			port:    "nft-transfer",
			channel: "channel-44",
		},
	},
	{
		channel_a: {
			chain_id: "elgafar-1",
			port:    "wasm.stars1ve46fjrhcrum94c7d8yc2wsdz8cpuw73503e8qn9r44spr6dw0lsvmvtqh",
			channel: "channel-210",
		},
		channel_b: {
			chain_id: "gon-flixnet-1",
			port:    "nft-transfer",
			channel: "channel-45",
		},
	},
	{
		channel_a: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-86",
		},
		channel_b: {
			chain_id: "uptick_7000-2",
			port:    "nft-transfer",
			channel: "channel-7",
		},
	},
	{
		channel_a: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-88",
		},
		channel_b: {
			chain_id: "uptick_7000-2",
			port:    "nft-transfer",
			channel: "channel-13",
		},
	},
	{
		channel_a: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-91",
		},
		channel_b: {
			chain_id: "gon-flixnet-1",
			port:    "nft-transfer",
			channel: "channel-46",
		},
	},
	{
		channel_a: {
			chain_id: "uni-6",
			port:    "wasm.juno1stv6sk0mvku34fj2mqrlyru6683866n306mfv52tlugtl322zmks26kg7a",
			channel: "channel-92",
		},
		channel_b: {
			chain_id: "gon-flixnet-1",
			port:    "nft-transfer",
			channel: "channel-47",
		},
	},
	{
		channel_a: {
			chain_id: "uptick_7000-2",
			port:    "nft-transfer",
			channel: "channel-5",
		},
		channel_b: {
			chain_id: "gon-flixnet-1",
			port:    "nft-transfer",
			channel: "channel-41",
		},
	},
	{
		channel_a: {
			chain_id: "uptick_7000-2",
			port:    "nft-transfer",
			channel: "channel-9",
		},
		channel_b: {
			chain_id: "gon-flixnet-1",
			port:    "nft-transfer",
			channel: "channel-42",
		},
	},
]

export const connections: { testnet: NFTConnection[], mainnet: NFTConnection[] } = {
  testnet: testnetConnections,
  mainnet: mainnetConnections,
}