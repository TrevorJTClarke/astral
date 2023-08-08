import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useChain, useManager } from '@cosmos-kit/react';
import { useQuery, useLazyQuery, useApolloClient, ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { AllNftInfoResponse } from "stargazejs/types/codegen/SG721Base.types";
import Loader from '../../../components/loader'
import NftImage from '../../../components/nft-image'
import Address from '../../../components/address'
import AliasAddress from '../../../components/alias-address'
import TransferModal from '../../../components/transfer-modal'
import {
  ArrowSmallRightIcon,
  CheckIcon,
  PaperAirplaneIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  ChevronUpIcon,
  ShoppingBagIcon,
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
  queryNftContractMsg,
} from '../../../contexts/ics721'

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

  // dynamic wallet/client connections
  const manager = useManager()

  // get contract address from url
  if (query.collection && !contractsAddress) setContractsAddress(`${query.collection}`);

  const getAllInfoCosmos = async () => {
    if (!contractsAddress || !currentChainName) return;

    try {
      const p = []
      const repo = manager.getWalletRepo(currentChainName)
      const cosmWasmClient = await repo.getCosmWasmClient();
      const nftInfo = await cosmWasmClient.queryContractSmart(contractsAddress, { all_nft_info: { token_id: `${query.tokenId}` || '' } })
      setTokenUri(nftInfo)

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
        // contractInfo.name gives class_id if minter is known bridge
        const classId = ics721.name
        const icsList = parseClassId(ics721.name)
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
      console.log('token t', t);

      setToken(t)
      setTokenUri({ access: { owner: token.owner }})
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
    if (currentChainName === ethereummainnet.chain_name) getEthereumData()
    else getCosmosData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChainName]);
  
  useEffect(() => {
    if (!contractsAddress) {
      setIsLoading(true);
      return;
    }
    const currentChain = getChainForAddress(contractsAddress)
    if (currentChain?.chain_name) setCurrentChainName(currentChain.chain_name)
    if (contractsAddress?.startsWith(ethereummainnet.bech32_prefix)) setCurrentChainName(ethereummainnet.chain_name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractsAddress]);

  useEffect(() => {
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

      {(!isLoading && !hasData) && (<div className="my-24 mx-auto text-center text-white">
        <h2 className="text-xl mb-4">No NFT Found!</h2>
      </div>)}

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
                <div className="my-8">
                  <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
                    <button onClick={() => setTransferModalOpen(true)} className="flex-none rounded-lg border border-transparent font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-pink-600 text-white shadow-sm hover:bg-pink-700 inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                      <span>Transfer</span>
                      <PaperAirplaneIcon className="flex-shrink-0 w-5 h-5 ml-2 text-white" />
                    </button>
                    {market && (
                      <a href={marketLink} target="_blank" className="flex-none rounded-lg border font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-transparent text-pink-500 shadow-sm hover:bg-pink hover:border-pink hover:text-white border-pink-500 inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                        <span className="flex-none">View on Market</span>
                        <ShoppingBagIcon className="flex-shrink-0 w-5 h-5 ml-2 " />
                      </a>
                    )}
                  </div>
                </div>
                <div className="col-span-2 mt-8 rounded-lg border border-zinc-800">
                  <div className="border-b border-zinc-800 p-4 sm:flex sm:items-center">
                    <div className="inline-flex flex-col justify-center sm:flex-auto sm:flex-row">
                      <h1 className="inline-flex flex-auto items-center gap-2 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="w-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"> </path> </svg>
                        <span>Provenance</span>
                      </h1>
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
                                      <img src={item.asset.logo_URIs.png} alt={item.chain.pretty_name} className="h-5 w-5 mr-2 flex-shrink-0 rounded-full" />
                                    )}
                                    <div className="grid place-items-center">
                                      {item.chain.pretty_name}
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

      <TransferModal imageUrl={imageUrl} isOpen={transferModalOpen} setOpen={setTransferModalOpen}></TransferModal>

    </div>
  );
}
