import { useState, useEffect, useMemo } from "react";
import { assets, chains } from 'chain-registry';
import { useRouter } from 'next/router';
import { useChain, useManager } from '@cosmos-kit/react';
import { useAccount } from 'wagmi'
import { useQuery, useLazyQuery, useApolloClient, ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { AllNftInfoResponse } from "stargazejs/types/codegen/SG721Base.types";
import Loader from '../../../components/loader'
import NftImage from '../../../components/nft-image'
import Address from '../../../components/address'
import AliasAddress from '../../../components/alias-address'
// import TransferModal from '../../../components/transfer-modal'
import { TransferModal } from '../../../components/transfers'
import {
  ArrowSmallRightIcon,
  CheckIcon,
  PaperAirplaneIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  ChevronUpIcon,
  ShoppingBagIcon,
  LockClosedIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline'
import {
  TData,
  Token,
  TransactionResult,
  Provenance,
} from '../../../components/types'
import {
  classNames,
  getHttpUrl,
  getMarketForAddress,
  getChainAssets,
  getChainForAddress,
  ethereummainnet,
  GET_TOKEN_ETHEREUM,
} from '../../../config'
import {
  availableNetworks,
  extendedChannels,
  NFTChannel,
  isBridgeAddress,
  getContractFromPort,
} from '../../../contexts/connections'
import {
  parseClassId,
  queryNftClassIdMsg,
  queryNftContractMsg,
  queryICSOutgoingBridgeProxy,
  queryICSProxyConfig,
  queryICSProxyCollectionWhitelist,
} from '../../../contexts/ics721'
import React from "react";
import Link from "next/link";

const apolloUriEthereum = process.env.NEXT_PUBLIC_APOLLO_URI_ETHEREUM || ''
const clientEthereum = new ApolloClient({
  uri: apolloUriEthereum,
  cache: new InMemoryCache(),
});

export default function NftDetail() {
  const { query } = useRouter()
  const [isLoading, setIsLoading] = useState(true);
  const [currentChainName, setCurrentChainName] = useState<string | undefined>();
  const [hasData, setHasData] = useState(false);
  const [data, setData] = useState<Partial<TData>>({});
  const [tokenUri, setTokenUri] = useState<Partial<AllNftInfoResponse>>({});
  const [token, setToken] = useState<Partial<Token>>({});
  const [contractsAddress, setContractsAddress] = useState<string | undefined>();
  const [provenance, setProvenance] = useState<Provenance[]>([]);
  const [getTokenEthereum, tokenEthereumQuery] = useLazyQuery(GET_TOKEN_ETHEREUM, { client: clientEthereum })

  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const isEthereumAddress = contractsAddress?.startsWith(ethereummainnet.bech32_prefix)

  const [isOwner, setIsOwner] = useState(false)
  // When the NFT proxy requires whitelist & this collection is not part of the whitelisted addresses
  const [isLocked, setIsLocked] = useState(false)
  // When the owner of the NFT matches an ICS721 bridge
  const [isEscrowed, setIsEscrowed] = useState(false)

  // dynamic wallet/client connections
  const manager = useManager()
  const ethAccount = useAccount()
  manager.addChains(chains, assets)

  // get contract address from url
  if (query.collection && !contractsAddress) setContractsAddress(`${query.collection}`);

  const getAllInfoCosmos = async () => {
    if (!contractsAddress || !currentChainName) return;

    try {
      const p: Promise<any>[] = []
      const repo = manager.getWalletRepo(currentChainName)
      const cosmWasmClient = await repo.getCosmWasmClient()
      let nftInfo
      try {
        nftInfo = await cosmWasmClient.queryContractSmart(contractsAddress, { all_nft_info: { token_id: `${query.tokenId}` || '' } })
        setTokenUri(nftInfo)
      } catch (e) {
        // if this has an error, we really can't get more meaningful data
        setHasData(false)
        setIsLoading(false)
        return;
      }

      if (nftInfo?.access?.owner) {
        const owner = nftInfo.access.owner

        // If owner matches any logged in wallet, im the owner
        if (repo.current?.address && repo.current?.address === owner) setIsOwner(true)

        if (owner.length > 44) {
          // pre-known list check
          if (isBridgeAddress(owner)) {
            setIsEscrowed(true)
          } else {
            // dynamic list check, if we ping a known bridge-only method, its def escrowed
            try {
              const res = await cosmWasmClient.queryContractSmart(owner, { nft_contracts: {} })
              if (res) setIsEscrowed(true)
            } catch (e) {
              // not escrowed
            }
          }
        }
      }

      p.push(cosmWasmClient.queryContractSmart(contractsAddress, { contract_info: {} }))
      p.push(cosmWasmClient.queryContractSmart(contractsAddress, { minter: {} }))

      // if is stargaze, otherwise bootstrap new cosmwasmclient
      if (currentChainName.search('stargaze') > -1) p.push(cosmWasmClient.queryContractSmart(contractsAddress, { collection_info: {} }))

      const [contractInfo, minter, collectionInfo] = await Promise.all(p)
      let ics721 = { ...contractInfo, ...minter }
      if (collectionInfo) ics721 = { ...ics721, ...collectionInfo }
      if (!ics721.creator) ics721.creator = ics721.minter

      setData((prev) => ({ ...prev, ...ics721, }))

      if (isBridgeAddress(ics721.minter)) {
        let class_id = await cosmWasmClient.queryContractSmart(ics721.minter, queryNftClassIdMsg(contractsAddress))
        if (!class_id) class_id = ics721.name
        // contractInfo.name gives class_id if minter is known bridge
        const classId = class_id
        const icsList = parseClassId(classId)
        
        const provenance = await Promise.all(icsList.map(async (item, idx): Promise<Provenance> => {
          // if only len 1, then its just a contract not bridged
          if (item.length <= 1) {
            const chain = getChainForAddress(item[0])
            let asset
            if (chain) {
              const assets = getChainAssets(chain)
              asset = assets?.assets ? assets.assets[0] : undefined
            }

            // adjust the data if its the origin
            try {
              const tmpRepo = manager.getWalletRepo(chain?.chain_name)
              const tmpClient = await tmpRepo.getCosmWasmClient()
              const contractInfo = await tmpClient.queryContractSmart(item[0], { contract_info: {} })
              const collectionInfo = await tmpClient.queryContractSmart(item[0], { collection_info: {} })
              setData((prev) => ({ ...prev, ...contractInfo, ...collectionInfo }))
            } catch (e) {
              console.error(e)
            }
            return {
              chain,
              asset,
              nft_addr: item[0],
              class_id: item[0],
              is_origin: true,
            }
          } else {
            // TODO: Process if locked!
            const bridge_addr = getContractFromPort(item[0])
            const chain = getChainForAddress(bridge_addr)
            let asset
            if (chain) {
              const assets = getChainAssets(chain)
              asset = assets?.assets ? assets.assets[0] : undefined
            }

            let nft_addr
            try {
              const tmpRepo = manager.getWalletRepo(chain?.chain_name)
              const tmpClient = await tmpRepo.getCosmWasmClient()
              nft_addr = await tmpClient.queryContractSmart(bridge_addr, queryNftContractMsg(classId))
            } catch (e) {
              console.error(e)
            }

            return {
              chain,
              asset,
              bridge_addr,
              channel_id: item[1],
              nft_addr,
              class_id: classId,
              is_origin: false,
            }
          }
        }))
        setProvenance(provenance)

        // since provenance > 1, check if its locked or can be transferred.
        if (provenance.length > 1) checkIfCosmosNftLocked(cosmWasmClient, getContractFromPort(icsList[0][0]))
      } else {
        const chain = getChainForAddress(contractsAddress)
        let asset
        if (chain) {
          const assets = getChainAssets(chain)
          asset = assets?.assets ? assets.assets[0] : undefined
        }
        // its origin, just make simple provenance record
        setProvenance([
          {
            chain,
            asset,
            nft_addr: contractsAddress,
            class_id: contractsAddress,
            is_origin: true,
          },
        ])
      }

      setHasData(true)
    } catch (error) {
      console.error(error);
      setHasData(false);
    }
  };

  const checkIfCosmosNftLocked = async (client, bridge) => {
    let proxy
    let config: any = {}
    // check if bridge has proxy
    try {
      const res = await client.queryContractSmart(bridge, queryICSOutgoingBridgeProxy())
      if (res) proxy = res
    } catch (e) {
      //
    }

    // check if proxy has WL collection settings in config (use get_config on proxy to check if WL, then check if collection is WL)
    try {
      const res = await client.queryContractSmart(proxy, queryICSProxyConfig())
      if (res) config = res
    } catch (e) {
      //
    }

    if (!config.collections_whitelist_enabled) return;

    // check if collection is WL in proxy
    try {
      const res = await client.queryContractSmart(proxy, queryICSProxyCollectionWhitelist())
      if (res) setIsLocked(!res.includes(contractsAddress))
    } catch (e) {
      //
    }
  }

  const getAllInfoEthereum = async () => {
    getTokenEthereum({
      client: clientEthereum,
      variables: {
        address: `${query.collection}`,
        tokenId: `${query.tokenId}`,
      },
    })
  }

  useEffect(() => {
    if (!isEthereumAddress) return;
    const { data, loading, error } = tokenEthereumQuery
    console.log('tokenEthereumQuery', data, loading, error);
    if (data && data.token) {
      console.log('token', data.token.token);
      const { token } = data.token
      let t = { ...token }

      if (t.image && t.image.mimeType === 'image/svg+xml') {
        t.backgroundUrl = `url('${t.image.url}')`
      }
      if (t.content && t.content.mimeType === 'image/svg+xml') {
        t.backgroundUrl = `url('${t.content.url}')`
      }

      // image adjust for computed onchain images!
      if (
        (t.image.url && t.image.mimeType === 'image/svg+xml') ||
        (t.content.url && t.content.mimeType === 'image/svg+xml')
      ) {
        // t.image = {
        //   backgroundUrl: `url('${t.image.url}')`,
        //   sourceUrl: t.image.url,
        // }
        t.backgroundUrl = `url('${t.image.url || t.content.url}')`
      } else if (t.image.url !== null && !t.imageUri) {
        t.imageUrl = t.image.url
      } else if (t.content.url !== null && !t.imageUri) {
        t.imageUrl = t.content.url
      }

      // adjust the image from metadata
      if (token?.image?.url) t.image = token.image.url
      if (token?.content?.url) t.image = token.content.url

      setToken(t)
      setTokenUri({ access: { owner: token.owner, approvals: [] }})
      setData({
        name: token.tokenContract.name,
        creator: token.mintInfo.originatorAddress,
      })

      // TODO: FINISH once we have gravity bridge finalized!!!
      setProvenance([
        {
          chain: ethereummainnet,
          asset: ethereummainnet.asset,
          nft_addr: contractsAddress || '',
          class_id: contractsAddress,
          is_origin: true,
        },
      ])

      // If owner matches any logged in wallet, im the owner
      if (token.owner === ethAccount?.address) setIsOwner(true)

      setHasData(true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenEthereumQuery.data]);

  const getCosmosData = async () => {
    setIsLoading(true);
    await getAllInfoCosmos()
    setIsLoading(false);
  };

  const getEthereumData = async () => {
    setIsLoading(true);
    await getAllInfoEthereum()
    setIsLoading(false);
  };

  useEffect(() => {
    if (!currentChainName) return;
    if (currentChainName === ethereummainnet.chain_name) getEthereumData()
    else getCosmosData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChainName]);
  
  useMemo(() => {
    if (!contractsAddress) {
      setIsLoading(true);
      return;
    }
    const currentChain = getChainForAddress(contractsAddress)
    // let cn = currentChain.chain_name
    // if (cn === 'terra2') cn = 'terra'
    if (currentChain?.chain_name) setCurrentChainName(currentChain.chain_name)
    if (isEthereumAddress) setCurrentChainName(ethereummainnet.chain_name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractsAddress, query.collection]);

  useMemo(() => {
    if (!contractsAddress || !tokenUri) {
      return;
    }
    const nftInfoUri = tokenUri?.info?.token_uri?.startsWith('https')
      ? tokenUri?.info?.token_uri
      : getHttpUrl(`${tokenUri?.info?.token_uri}`)
    if (nftInfoUri) fetch(nftInfoUri)
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        // throw res
      })
      .then(data => {
        setToken((prev) => ({
          ...prev,
          ...data,
          imageUrl: data.image.url || data.image,
        }));
      })
      .catch(e => {
        // 
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractsAddress, tokenUri]);

  const imageUrl = token.imageUrl && !token.backgroundUrl ? getHttpUrl(token?.imageUrl) : null
  const tokenDescription = `${token.description}`
  const tokenChain = contractsAddress ? getChainForAddress(contractsAddress) : null
  const market = contractsAddress ? getMarketForAddress(`${contractsAddress}`) : null
  const marketLink = market ? market.marketDetailLink(contractsAddress, query.tokenId) : null

  if (tokenChain) {
    const assetList = getChainAssets(tokenChain)
    tokenChain.asset = assetList?.assets ? assetList.assets[0] : null
    // if (!srcNetwork) setSrcNetwork(tokenChain)
  }

  return (
    <div className="min-h-window p-4">

      {isLoading && (<div className="relative mx-auto mb-24 text-center text-white">
        <Loader />
        <h2 className="text-2xl animate-pulse">Loading...</h2>
      </div>)}

      {(!isLoading && !hasData) && (
        <div className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-100 sm:text-5xl">NFT not found</h1>
            <p className="mt-6 text-base leading-7 text-gray-600">Sorry, we couldn’t find the NFT you’re looking for.</p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/my-nfts">
                <div className="cursor-pointer rounded-md bg-pink-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600">
                  View My NFTs
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {(!isLoading && hasData) && (
        <div>

          <div className="mx-auto bg-white p-4 pb-12 dark:bg-black sm:p-6 lg:p-8">
            <div className="mx-auto gap-x-8 p-0 sm:px-6 lg:grid lg:max-w-screen-2xl lg:grid-cols-2 lg:gap-x-24">
              <div className="flex flex-col shrink divide-y border bg-white transition-shadow rounded-lg border-zinc-300 shadow-sm dark:border-zinc-800 divide-zinc-300 hover:shadow-md dark:divide-zinc-800 dark:bg-black w-full overflow-hidden rounded-l-lg sm:rounded-t-lg sm:rounded-bl-none" >
                <NftImage uri={imageUrl} alt={token.name} backgroundUrl={token.backgroundUrl} />
              </div>
              <div className="mt-8 lg:mt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <a className="mb-2 text-xs font-semibold uppercase text-pink-500 hover:text-pink" href="">{data.name}</a>
                    <div className="mb-2 text-2xl font-semibold">{token.name}</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-300">
                  {tokenDescription}
                </div>
                <p className="flex mt-2 text-sm text-zinc-300">
                  <span className="mr-2">Created by</span>
                  <AliasAddress>{data.creator || ''}</AliasAddress>
                </p>
                <p className="flex mt-2 text-sm text-zinc-300">
                  <span className="mr-2">Owner</span>
                  <AliasAddress>{tokenUri?.access?.owner || ''}</AliasAddress>
                </p>
                <div className="flex my-8">
                  <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
                    {isOwner && !isLocked && (
                      <button disabled={isEthereumAddress} onClick={() => setTransferModalOpen(true)} className="flex-none rounded-lg border border-transparent font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-pink-600 text-white shadow-sm hover:bg-pink-700 inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                        <span>Transfer</span>
                        <PaperAirplaneIcon className="flex-shrink-0 w-5 h-5 ml-2 text-white" />
                      </button>
                    )}
                    {isOwner && isLocked && (
                      <div className="relative cursor-help" title="This NFT is locked. Requires the bridge to whitelist the collection to enable interchain transfer.">
                        <button disabled={isEthereumAddress} onClick={() => setTransferModalOpen(true)} className="flex-none cursor-help rounded-lg border border-transparent font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 bg-gray-600 text-white shadow-sm inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                          <span>Transfer</span>
                          {/* <PaperAirplaneIcon className="flex-shrink-0 w-5 h-5 ml-2 text-white" /> */}
                          <div className="inline-flex my-auto ml-4 px-1 py-1 rounded-full text-white/75 hover:text-white bg-gray-700">
                            <LockClosedIcon className="w-4 h-4" />
                          </div>
                        </button>
                      </div>
                    )}
                    {market && (
                      <a href={marketLink} target="_blank" rel="noreferrer" className="flex-none rounded-lg border font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-transparent text-pink-500 shadow-sm hover:bg-pink hover:border-pink hover:text-pink-300 border-pink-500 inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                        <span className="flex-none">View on Market</span>
                        <ShoppingBagIcon className="flex-shrink-0 w-5 h-5 ml-2 " />
                      </a>
                    )}
                  </div>
                </div>
                <div className="col-span-2 mt-8 rounded-lg border border-zinc-800">
                  <div className="border-b border-zinc-800 p-4 sm:flex sm:items-center">
                    <div className="flex w-full">
                      <h1 className="inline-flex flex-auto items-center gap-2 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="w-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"> </path> </svg>
                        <span>Provenance</span>
                      </h1>

                      <div className="flex">
                        {isEscrowed && (
                          <div title="This NFT is escrowed by the bridge. The ownership of this NFT currently exists on a different chain." className="rounded-lg border border-transparent font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-blue-600/50 hover:bg-blue-600 cursor-help text-white shadow-sm  inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                            <span>Escrowed</span>
                            <ArchiveBoxIcon className="flex-shrink-0 w-5 h-5 ml-2 text-white" />
                          </div>
                        )}
                        {isLocked && (
                          <div title="This NFT is locked. Requires the bridge to whitelist the collection to enable interchain transfer." className="inline-flex my-auto ml-4 px-3 py-2 rounded-full cursor-help text-white/75 hover:text-white bg-gray-600/20 hover:bg-gray-600/60">
                            <LockClosedIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full align-middle md:px-6 lg:px-8">
                        <table className="min-w-full">
                          <thead>
                            <tr className="overflow-scroll">
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 text-left font-medium justify-center text-sm"> Chain</th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 font-medium text-left text-sm"> NFT Contract</th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 font-medium text-left text-sm sm:pl-4"> Bridge</th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 font-medium min-w-min text-left text-sm"> Channel</th>
                              <th scope="col" className="sticky top-0 z-10 border-b border-zinc-800 px-3 py-3.5 font-medium text-left text-sm"> Origin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {provenance.map((item, idx) => (
                              <tr key={idx} className="">
                                <td className="border-t border-zinc-800 whitespace-nowrap py-4 pl-4 pr-3 text-left text-sm font-medium text-zinc-300 hover:text-white">
                                  <div className="flex">
                                    {item.asset?.logo_URIs?.png && (
                                      <img src={item.asset.logo_URIs.png} alt={item?.chain?.pretty_name || item?.chain?.chain_name} className="h-5 w-5 mr-2 flex-shrink-0 rounded-full" />
                                    )}
                                    <div className="grid place-items-center">
                                      {item?.chain?.pretty_name || item?.chain?.chain_name}
                                    </div>
                                  </div>
                                </td>
                                <td className="border-t border-zinc-800 whitespace-nowrap px-3 py-4 text-left text-sm text-zinc-300 hover:text-white">
                                  <Address len={8}>{item.nft_addr || ''}</Address>
                                </td>
                                <td className="border-t border-zinc-800 whitespace-nowrap px-3 py-4 text-left text-sm text-zinc-300 hover:text-white">
                                  {item.bridge_addr && (
                                    <Address len={8}>{item.bridge_addr || ''}</Address>
                                  )}
                                </td>
                                <td className="border-t border-zinc-800 whitespace-nowrap px-3 py-4 text-left text-sm text-zinc-300 hover:text-white">
                                  {item.channel_id || ''}
                                </td>
                                <td className="border-t border-zinc-800 whitespace-nowrap px-3 py-4 text-left text-sm text-zinc-300">
                                  {item.is_origin ? 'Yes' : 'No'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      )}

      <TransferModal imageUrl={imageUrl} isOpen={transferModalOpen} setOpen={(b) => setTransferModalOpen(b)} />

    </div>
  );
}
