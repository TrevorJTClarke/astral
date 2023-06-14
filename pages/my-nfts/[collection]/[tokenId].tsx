import { Fragment, useRef, useState, useEffect } from "react";
import { AssetList, Asset, Chain } from '@chain-registry/types';
import { toBase64, toUtf8 } from "@cosmjs/encoding";
import { StdFee } from '@cosmjs/stargate';
import { Dialog, Disclosure, Listbox, Transition } from '@headlessui/react'
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';
import { useChain, useManager } from '@cosmos-kit/react';
import { AllNftInfoResponse } from "stargazejs/types/codegen/SG721Base.types";
import Loader from '../../../components/loader'
import NftLoader from '../../../components/nft-loader'
import NftImage from '../../../components/nft-image'
import Address from '../../../components/address'
import AliasAddress from '../../../components/alias-address'
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

export enum TransferView {
  Setup,
  Sending,
  Complete,
  Error,
}

// TODO: Self-Relay enum

const allSteps = [
  { name: 'IBC Send', href: '#', status: 'current', description: 'Origin network sent asset' },
  { name: 'IBC Receive', href: '#', status: 'upcoming', description: 'Destination network received asset' },
  { name: 'IBC Confirm', href: '#', status: 'upcoming', description: 'Origin network acknowledged asset receipt' },
]

export default function NftDetail() {
  const { query } = useRouter()
  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState<string | undefined>();
  const [currentChainName, setCurrentChainName] = useState<string | undefined>();
  const [hasData, setHasData] = useState(false);
  const [data, setData] = useState<Partial<TData>>({});
  const [tokenUri, setTokenUri] = useState<Partial<AllNftInfoResponse>>({});
  const [token, setToken] = useState<Partial<Token>>({});
  const [contractsAddress, setContractsAddress] = useState<string | undefined>();
  const [provenance, setProvenance] = useState<Provenance[]>([]);

  const [open, setOpen] = useState(false)
  const cancelButtonRef = useRef(null)
  // TODO: Change to this tokens network
  const [srcNetwork, setSrcNetwork] = useState<Chain[] | undefined>(availableNetworks[0])
  const [destNetwork, setDestNetwork] = useState<Chain[] | undefined>(availableNetworks[0])
  const [availableChannels, setAvailableChannels] = useState<NFTChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<NFTChannel | undefined>()
  const [currentView, setCurrentView] = useState<TransferView>(TransferView.Setup);
  const [currentSteps, setCurrentSteps] = useState(allSteps);
  const [currentIbcStep, setCurrentIbcStep] = useState(0);
  const [receiver, setReceiver] = useState('');
  
  // dynamic wallet/client connections
  const manager = useManager()

  // get contract address from url
  if (query.collection && !contractsAddress) setContractsAddress(`${query.collection}`);

  const getAllInfo = async () => {
    if (!contractsAddress || !currentChainName) return;

    try {
      const p = []
      const repo = manager.getWalletRepo(currentChainName)
      if (repo.current?.address) setAddress(repo.current.address)
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
        const provenance = await Promise.all(icsList.map(async (item, idx) => {
          let proveItem = {}

          // if only len 1, then its just a contract not bridged
          if (item.length <= 1) {
            const chain = getChainForAddress(item[0])
            let asset
            if (chain) {
              const assets = getChainAssets(chain)
              asset = assets?.assets ? assets.assets[0] : null
            }
            proveItem = {
              chain,
              asset,
              nft_addr: contractsAddress,
              class_id: contractsAddress,
              is_origin: true,
            }

            // adjust the data if its the origin
            try {
              const tmpRepo = manager.getWalletRepo(chain?.chain_name)
              const tmpClient = await tmpRepo.getCosmWasmClient()
              const contractInfo = await tmpClient.queryContractSmart(item[0], { contract_info: {} })
              const collectionInfo = await tmpClient.queryContractSmart(item[0], { collection_info: {} })
              console.log('origin collection res', contractInfo, collectionInfo)
              setData((prev) => ({ ...prev, ...contractInfo, ...collectionInfo }))
            } catch (e) {
              console.error(e)
            }
          } else {
            const bridge_addr = getContractFromPort(item[0])
            const chain = getChainForAddress(bridge_addr)
            let asset
            if (chain) {
              const assets = getChainAssets(chain)
              asset = assets?.assets ? assets.assets[0] : null
            }

            let nft_addr
            try {
              const tmpRepo = manager.getWalletRepo(chain?.chain_name)
              const tmpClient = await tmpRepo.getCosmWasmClient()
              nft_addr = await tmpClient.queryContractSmart(bridge_addr, queryNftContractMsg(classId))
            } catch (e) {
              console.error(e)
            }

            proveItem = {
              chain,
              asset,
              bridge_addr,
              channel_id: item[1],
              nft_addr,
              class_id: classId,
              is_origin: false,
            }
          }

          return proveItem
        }))
        setProvenance(provenance)
      } else {
        const chain = getChainForAddress(contractsAddress)
        let asset
        if (chain) {
          const assets = getChainAssets(chain)
          asset = assets?.assets ? assets.assets[0] : null
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

  const getData = async () => {
    setIsLoading(true);
    await getAllInfo()
    setIsLoading(false);
  };

  const startTransfer = async () => {
    setCurrentView(TransferView.Sending)
    await submitTransfer()

    setTimeout(() => {
      setCurrentIbcStep(1)
    }, 2000)
    setTimeout(() => {
      setCurrentIbcStep(2)
    }, 4500)

    setTimeout(() => {
      setCurrentView(TransferView.Complete)
      // setCurrentIbcStep(1)
      // setCurrentView(TransferView.Error)
    }, 6000)
  }

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChainName]);
  
  useEffect(() => {
    if (!contractsAddress) {
      setIsLoading(true);
      return;
    }
    const currentChain = getChainForAddress(contractsAddress)
    if (currentChain?.chain_name) setCurrentChainName(currentChain.chain_name)
    console.log('HERE currentChain!!!!!!!!!!!!!!!!!!!!!', currentChain, currentChainName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractsAddress]);

  useEffect(() => {
    if (!contractsAddress || !tokenUri) {
      return;
    }
    console.log('GET THE IPFS STUFF')
    const nftInfoUri = tokenUri?.info?.token_uri?.startsWith('https')
      ? tokenUri?.info?.token_uri
      : getHttpUrl(`${tokenUri?.info?.token_uri}`);
    console.log('nftInfoUri', nftInfoUri)
    if (nftInfoUri) fetch(nftInfoUri)
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        // throw res
      })
      .then(data => {
        console.log('TOKEN URI', data)
        setToken((prev) => ({
          ...prev,
          ...data,
        }));
      })
      .catch(e => {
        // 
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractsAddress, tokenUri]);

  // TODO: check other cases!
  useEffect(() => {
    if (!open) {
      setCurrentView(TransferView.Setup);
    }
  }, [open]);

  useEffect(() => {
    const as = allSteps.map((s, idx) => {
      if (currentIbcStep > idx) s.status = 'complete'
      if (currentIbcStep === idx) s.status = 'current'
      if (currentIbcStep < idx) s.status = 'upcoming'
      return s
    })
    setCurrentSteps(as)
  }, [currentIbcStep]);

  useEffect(() => {
    // filter to channels only for selected network and base network
    const chain_id = srcNetwork.chain_id
    const foundChannels: NFTChannelChain[] = []

    // TODO: Filter to src + dest channels
    extendedChannels.forEach(channels => {
      Object.keys(channels).forEach(k => {
        if (chain_id === channels[k].chain_id) foundChannels.push(channels[k])
      })
    })
    console.log('srcNetwork, foundChannels', srcNetwork, foundChannels)

    setAvailableChannels(foundChannels)
    if (foundChannels.length > 0) setSelectedChannel(foundChannels[0])
  }, [destNetwork]);

  const imageUrl = getHttpUrl(token?.image)
  console.log('token', token)
  const tokenDescription = `${token.description}`
  const tokenChain = contractsAddress ? getChainForAddress(contractsAddress) : null
  const market = contractsAddress ? getMarketForAddress(`${contractsAddress}`) : null

  if (tokenChain) {
    const assetList = getChainAssets(tokenChain)
    tokenChain.asset = assetList?.assets ? assetList.assets[0] : null
    if (!srcNetwork) setSrcNetwork(tokenChain)
  }

  const submitTransfer = async () => {
    if (!address || !contractsAddress) return;
    const cosmWasmClient = await getCosmWasmClient();
    const status = await cosmWasmClient.tmClient.status()

    // request recent height
    const recentHeight = status?.syncInfo?.latestBlockHeight ? status.syncInfo.latestBlockHeight : 0
    console.log('recentHeight', recentHeight);
    // TODO: handle error here
    if (!recentHeight) return;
    // TODO: handle error here
    if (!receiver || !selectedChannel?.channel) return;
    console.log('receiver, selectedChannel', receiver, selectedChannel);

    const ibcMsg = {
      receiver,
      channel_id: selectedChannel?.channel, // "channel-230",
      timeout: {
        block: {
          revision: 6, // TODO: seems to be the chain_id split end
          height: recentHeight + 30
        }
      }
    }

    let contractPort: string | undefined;
    if (selectedChannel?.port && `${selectedChannel.port}`.search('wasm') > -1) {
      contractPort = `${selectedChannel.port}`.split('.')[1]
    }

    const msg = {
      send_nft: {
        contract: `${contractPort}`,
        token_id: `${query.tokenId}`,
        msg: toBase64(toUtf8(JSON.stringify(ibcMsg)))
      }
    }
    console.log('-----------------------> msg', msg)

    const fee: StdFee = {
      amount: [
        {
          denom: 'ustars',
          amount: '2500',
        },
      ],
      gas: new BigNumber('1450000').toString(),
    };

    // get signer!
    const signingCosmWasmClient = await getSigningCosmWasmClient();
    console.log('signingCosmWasmClient', signingCosmWasmClient, address, fee)
    try {
      // const res = await signingCosmWasmClient.signAndBroadcast(
      const res = await signingCosmWasmClient.execute(
        address,
        contractsAddress,
        msg,
        fee,
        // 'auto',
      );
      console.log('signingCosmWasmClient res', res);
      // getData();
    } catch (e) {
      console.error('signingCosmWasmClient e', e);
    } finally {
      signingCosmWasmClient.disconnect();
    }
  }

  return (
    <div className="my-4">

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
                <NftImage uri={imageUrl} alt={token.name} />
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
                    <button onClick={() => setOpen(true)} className="flex-none rounded-lg border border-transparent font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-pink-600 text-white shadow-sm hover:bg-pink-700 inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                      <span>Transfer</span>
                      <PaperAirplaneIcon className="flex-shrink-0 w-5 h-5 ml-2 text-white" />
                    </button>
                    {market && (
                      <a href={market.marketLink} className="flex-none rounded-lg border font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed disabled:opacity-40 bg-transparent text-pink-500 shadow-sm hover:bg-pink hover:border-pink hover:text-white border-pink-500 inline-flex items-center justify-center h-10 px-4 py-2 text-sm" type="submit">
                        <span className="flex-none">View Market</span>
                        <ShoppingBagIcon className="flex-shrink-0 w-5 h-5 ml-2 " />
                      </a>
                    )}
                  </div>
                </div>
                {/* <div className="my-8 flex flex-wrap justify-start gap-y-3 rounded-lg border border-zinc-800 p-3 md:mt-0 md:justify-between md:gap-y-3 md:p-4">
                  <div className="flex w-1/3 flex-col gap-1 md:w-auto md:gap-2">
                    <div className="text-sm text-zinc-400">Owner</div>
                    <div className="text-sm text-white">
                      <span className="group inline-flex max-w-full items-center gap-2 text-pink-500 hover:text-pink-600">
                        <span className="max-w-full">
                          <a className="rounded-sm focus-visible:outline focus-visible:outline-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2" href="/profile/stars13fmynf7lartwxfx4c3cv3afe07qlckzyudv8rz">
                            <span className="inline-flex relative overflow-hidden max-w-full">
                              <span aria-hidden="false" className="max-w-full break-all transition">333mm.stars</span>
                              <span className="absolute inset-0 inline-flex items-center transition translate-y-8 opacity-0">
                                <span className="truncate" aria-hidden="true">stars13f...v8rz</span>
                              </span>
                            </span>
                          </a>
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex w-1/3 flex-col gap-1 md:w-auto md:gap-2">
                    <div className="text-sm text-zinc-400">Last Sale</div>
                    <div className="text-sm text-white">28K STARS</div>
                  </div>
                  <div className="flex w-1/3 flex-col gap-1 md:w-auto md:gap-2">
                    <div className="text-sm text-zinc-400">Top Offer</div>
                    <div className="text-sm text-white">22.1K STARS</div>
                  </div>
                </div> */}
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

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" initialFocus={cancelButtonRef} onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-zinc-800/75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform rounded-xl bg-white dark:bg-black p-8 [min-height:18rem] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg md:max-w-3xl">
                  
                  {currentView === TransferView.Setup && (
                    <div>
                      <div className="relative mt-0 text-left sm:mt-0">
                        <Dialog.Title as="div" className="text-2xl font-semibold leading-6 text-gray-100">
                          Transfer

                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Move an NFT to any recipient on any network.
                            </p>
                          </div>
                        </Dialog.Title>

                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-transparent opacity-70 hover:opacity-100 hover:bg-gray-800 px-4 py-3 rounded-xl"
                          onClick={() => setOpen(false)}
                          ref={cancelButtonRef}
                        >
                          <XMarkIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                        </button>

                        <div className="grid gap-20 grid-cols-2 mt-8">
                          <div className="relative">
                            <label className="block text-sm font-medium leading-6 text-gray-300">From</label>
                            <div className="relative mt-2 w-full cursor-default rounded-md bg-black py-4 pl-3 pr-10 text-left text-gray-100 shadow-sm ring-2 ring-inset ring-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 sm:text-sm sm:leading-6">
                              {tokenChain && (
                                <span className="flex items-center">
                                  {tokenChain?.asset?.logo_URIs?.png && (
                                    <img src={tokenChain.asset.logo_URIs.png} alt={tokenChain.pretty_name} className="h-10 w-10 flex-shrink-0 rounded-full" />
                                  )}
                                  <span className="ml-3 text-xl block truncate">{tokenChain.pretty_name}</span>
                                </span>
                              )}
                            </div>

                            <ArrowSmallRightIcon className="absolute top-1/2 -right-[55px] h-8 w-8 text-gray-400" aria-hidden="true" />
                          </div>
                          <div>
                            <Listbox value={destNetwork} onChange={setDestNetwork}>
                              {({ open }) => (
                                <>
                                  <Listbox.Label className="block text-sm font-medium leading-6 text-gray-300">To</Listbox.Label>
                                  <div className="relative mt-2">
                                    <Listbox.Button className="relative w-full cursor-default rounded-md bg-black py-4 pl-3 pr-10 text-left text-gray-100 shadow-sm ring-2 ring-inset ring-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 sm:text-sm sm:leading-6">
                                      <span className="flex items-center">
                                        {destNetwork?.asset?.logo_URIs?.png && (
                                          <img src={destNetwork.asset.logo_URIs.png} alt={destNetwork.pretty_name} className="h-10 w-10 flex-shrink-0 rounded-full" />
                                        )}
                                        <span className="ml-3 text-xl block truncate">{destNetwork.pretty_name}</span>
                                      </span>
                                      <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                      </span>
                                    </Listbox.Button>

                                    <Transition
                                      show={open}
                                      as={Fragment}
                                      leave="transition ease-in duration-100"
                                      leaveFrom="opacity-100"
                                      leaveTo="opacity-0"
                                    >
                                      <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-gray-900 py-1 text-base shadow-lg ring-2 ring-gray-800 ring-opacity-5 focus:outline-none sm:text-sm">
                                        {availableNetworks.map((network) => (
                                          <Listbox.Option
                                            key={network.chain_id}
                                            className={({ active }) =>
                                              classNames(
                                                active ? 'bg-pink-600 text-white' : 'text-gray-300',
                                                'relative cursor-default select-none py-4 pl-3 pr-9'
                                              )
                                            }
                                            value={network}
                                          >
                                            {({ selected, active }) => (
                                              <>
                                                <div className="flex items-center">
                                                  {network?.asset?.logo_URIs?.png && (
                                                    <img src={network.asset.logo_URIs.png} alt={network.pretty_name} className="h-5 w-5 flex-shrink-0 rounded-full" />
                                                  )}
                                                  <span
                                                    className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}
                                                  >
                                                    {network.pretty_name}
                                                  </span>
                                                </div>

                                                {selected ? (
                                                  <span
                                                    className={classNames(
                                                      active ? 'text-white' : 'text-pink-600',
                                                      'absolute inset-y-0 right-0 flex items-center pr-4'
                                                    )}
                                                  >
                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                  </span>
                                                ) : null}
                                              </>
                                            )}
                                          </Listbox.Option>
                                        ))}
                                      </Listbox.Options>
                                    </Transition>
                                  </div>
                                </>
                              )}
                            </Listbox>
                          </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                          <div className="sm:col-span-8">
                            <label htmlFor="recipient" className="block text-sm font-medium leading-6 text-white">
                              Recipient
                            </label>
                            <div className="mt-2">
                              <div className="flex rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-500">
                                <input
                                  type="text"
                                  name="recipient"
                                  id="recipient"
                                  autoComplete="recipient"
                                  className="w-full flex-1 border-0 bg-transparent p-4 text-white focus:ring-0 sm:text-sm sm:leading-6"
                                  placeholder={address?.substring(0, 22) + '...'}
                                  onChange={(e) => setReceiver(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <Disclosure>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex mt-8 text-gray-300 mx-auto">
                                <span className="uppercase text-xs">Advanced</span>
                                <ChevronUpIcon
                                  className={`${open ? 'rotate-180 transform' : ''
                                    } h-4 w-4 ml-2`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="">
                                <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                  <div className="sm:col-span-8">
                                    <div className="mt-2">
                                      <Listbox value={selectedChannel} onChange={setSelectedChannel}>
                                        {({ open }) => (
                                          <>
                                            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-300">Channel</Listbox.Label>
                                            <div className="relative mt-2">
                                              <Listbox.Button className="relative w-full cursor-default rounded-md bg-black py-4 pl-3 pr-10 text-left text-gray-100 shadow-sm ring-2 ring-inset ring-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 sm:text-sm sm:leading-6">
                                                <span className="flex items-center">
                                                  {selectedChannel?.asset?.logo_URIs?.png && (
                                                    <img src={selectedChannel.asset.logo_URIs.png} alt={selectedChannel.chain.pretty_name} className="h-10 w-10 flex-shrink-0 rounded-full" />
                                                  )}
                                                  {selectedChannel?.chain?.pretty_name && (
                                                    <>
                                                      <span className="ml-3 text-xl block truncate">{selectedChannel.chain.pretty_name}</span>
                                                      <span className="ml-3 text-xl block truncate">{selectedChannel.channel}</span>
                                                    </>
                                                  )}
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                                                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                              </Listbox.Button>

                                              <Transition
                                                show={open}
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                              >
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-gray-900 py-1 text-base shadow-lg ring-2 ring-gray-800 ring-opacity-5 focus:outline-none sm:text-sm">
                                                  {availableChannels.map((channel) => (
                                                    <Listbox.Option
                                                      key={channel.channel}
                                                      className={({ active }) =>
                                                        classNames(
                                                          active ? 'bg-pink-600 text-white' : 'text-gray-300',
                                                          'relative cursor-default select-none py-4 pl-3 pr-9'
                                                        )
                                                      }
                                                      value={channel}
                                                    >
                                                      {({ selected, active }) => (
                                                        <>
                                                          <div className="flex items-center">
                                                            {channel.asset?.logo_URIs?.png && (
                                                              <img src={channel.asset.logo_URIs.png} alt={channel.channel} className="h-5 w-5 flex-shrink-0 rounded-full" />
                                                            )}
                                                            {channel?.chain?.pretty_name && (
                                                              <>
                                                                <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}>{channel.chain.pretty_name}</span>
                                                                <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}>{channel.channel}</span>
                                                              </>
                                                            )}
                                                          </div>

                                                          {selected ? (
                                                            <span
                                                              className={classNames(
                                                                active ? 'text-white' : 'text-pink-600',
                                                                'absolute inset-y-0 right-0 flex items-center pr-4'
                                                              )}
                                                            >
                                                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                          ) : null}
                                                        </>
                                                      )}
                                                    </Listbox.Option>
                                                  ))}
                                                </Listbox.Options>
                                              </Transition>
                                            </div>
                                          </>
                                        )}
                                      </Listbox>
                                    </div>
                                  </div>
                                </div>
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>

                        <div className="mt-8 px-3 py-2 flex justify-between text-sm text-gray-400 rounded-xl border border-1 border-gray-800">
                          <p>Estimated Time</p>
                          <p>45 seconds</p>
                        </div>

                      </div>
                      <div className="mt-12 sm:mt-6 md:mt-12 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-4">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-pink-600 hover:bg-pink-600/80 px-8 py-4 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 sm:col-start-2"
                          onClick={startTransfer}
                        >
                          Send
                          <PaperAirplaneIcon className="flex-shrink-0 w-5 h-5 ml-2 text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {currentView === TransferView.Sending && (
                    <div>
                      <div className="relative mt-0 text-left sm:mt-0">
                        <Dialog.Title as="div" className="text-2xl animate-pulse font-semibold leading-6 text-gray-100">
                          Transfering...

                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Please be patient while your transfer is in progress.
                            </p>
                          </div>
                        </Dialog.Title>

                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-transparent opacity-0 hover:opacity-100 hover:bg-gray-800 px-4 py-3 rounded-xl"
                          onClick={() => setOpen(false)}
                          ref={cancelButtonRef}
                        >
                          <XMarkIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                        </button>

                        <div className="relative mx-auto mt-8 text-center text-white">
                          <NftLoader uri={imageUrl} alt={token.name} />

                          <nav className="flex flex-col items-center justify-center" aria-label="Progress">
                            <ol role="list" className="mb-4 flex items-center space-x-5 pointer-events-none">
                              {currentSteps.map((step) => (
                                <li key={step.name}>
                                  {step.status === 'complete' ? (
                                    <a href={step.href} className="block h-2.5 w-2.5 rounded-full bg-pink-600 hover:bg-pink-900">
                                      <span className="sr-only">{step.name}</span>
                                    </a>
                                  ) : step.status === 'current' ? (
                                    <a href={step.href} className="relative flex items-center justify-center" aria-current="step">
                                      <span className="absolute flex h-5 w-5 p-px" aria-hidden="true">
                                          <span className="h-full w-full rounded-full bg-pink-900/60" />
                                      </span>
                                        <span className="relative block h-2.5 w-2.5 rounded-full bg-pink-600" aria-hidden="true" />
                                      <span className="sr-only">{step.name}</span>
                                    </a>
                                  ) : (
                                    <a href={step.href} className="block h-2.5 w-2.5 rounded-full bg-gray-800 hover:bg-gray-600">
                                      <span className="sr-only">{step.name}</span>
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ol>
                            <p className="text-sm text-gray-500 font-medium animate-pulse">
                              {currentSteps[currentSteps.findIndex((step) => step.status === 'current')].name}
                            </p>
                          </nav>
                        </div>

                      </div>
                    </div>
                  )}
                  
                  {currentView === TransferView.Complete && (
                    <div>
                      <div className="flex flex-col relative mt-0 text-center sm:mt-0">
                        <Dialog.Title as="div" className="text-2xl font-semibold leading-6 text-gray-100">
                          🎉 Success! 🎉

                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Your transfer has finished. Time for confetti! 
                            </p>
                          </div>
                        </Dialog.Title>

                        {/* <button
                          type="button"
                          className="absolute top-0 right-0 bg-transparent opacity-70 hover:opacity-100 hover:bg-gray-800 px-4 py-3 rounded-xl"
                          onClick={() => setOpen(false)}
                          ref={cancelButtonRef}
                        >
                          <XMarkIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                        </button> */}

                        <div className="relative mx-auto h-[250px] mt-8 text-center text-white">
                          <NftImage className="h-[250px] w-[250px]" uri={imageUrl} alt={token.name} />
                        </div>

                        <div className="mt-12 sm:mt-6 md:mt-12 flex justify-center">
                          <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-pink-600 hover:bg-pink-600/80 px-8 py-4 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 sm:col-start-2"
                            onClick={() => setOpen(false)}
                          >
                            Close
                          </button>
                        </div>

                      </div>
                    </div>
                  )}
                  
                  {currentView === TransferView.Error && (
                    <div>
                      <div className="relative mt-0 text-left sm:mt-0">
                        <Dialog.Title as="div" className="text-2xl font-semibold leading-6 text-gray-100">
                          Transfer Error

                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Something went wrong with your transfer.
                            </p>
                          </div>
                        </Dialog.Title>

                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-transparent opacity-0 hover:opacity-100 hover:bg-gray-800 px-4 py-3 rounded-xl"
                          onClick={() => setOpen(false)}
                          ref={cancelButtonRef}
                        >
                          <XMarkIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                        </button>

                        <div className="flex justify-start gap-16 relative mx-auto mt-8">
                          <NftImage className="h-[250px] w-[250px]" uri={imageUrl} alt={token.name} />

                          <div className="my-auto">
                            <nav aria-label="Progress">
                              <ol role="list" className="overflow-hidden pointer-events-none">
                                {currentSteps.map((step, stepIdx) => (
                                  <li key={step.name} className={classNames(stepIdx !== currentSteps.length - 1 ? 'pb-10' : '', 'relative')}>
                                    {step.status === 'complete' || step.status === 'error' ? (
                                      <>
                                        {stepIdx !== currentSteps.length - 1 ? (
                                          // <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-pink-600" aria-hidden="true" />
                                          <div className={classNames(step.status === 'error' ? 'bg-gray-600' : 'bg-pink-600', 'absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5')} aria-hidden="true" />
                                        ) : null}
                                        <a href={step.href} className="group relative flex items-start">
                                          <span className="flex h-9 items-center">
                                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-pink-600">
                                              {step.status === 'complete' ? (
                                                <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                              ) : (
                                                <XMarkIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                              )}
                                            </span>
                                          </span>
                                          <span className="ml-4 flex min-w-0 flex-col">
                                            <span className="text-sm text-white font-medium">{step.name}</span>
                                            <span className="text-sm text-gray-500">{step.description}</span>
                                          </span>
                                        </a>
                                      </>
                                    ) : step.status === 'current' ? (
                                      <>
                                        {stepIdx !== currentSteps.length - 1 ? (
                                          <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-600" aria-hidden="true" />
                                        ) : null}
                                        <a href={step.href} className="group relative flex items-start" aria-current="step">
                                          <span className="flex h-9 items-center" aria-hidden="true">
                                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-pink-600 bg-black">
                                              <span className="h-2.5 w-2.5 rounded-full bg-pink-600" />
                                            </span>
                                          </span>
                                          <span className="ml-4 flex min-w-0 flex-col">
                                            <span className="text-sm font-medium text-pink-600">{step.name}</span>
                                            <span className="text-sm text-gray-500">{step.description}</span>
                                          </span>
                                        </a>
                                      </>
                                    ) : (
                                      <>
                                        {stepIdx !== currentSteps.length - 1 ? (
                                          <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-800" aria-hidden="true" />
                                        ) : null}
                                        <a href={step.href} className="group relative flex items-start">
                                          <span className="flex h-9 items-center" aria-hidden="true">
                                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-600 bg-black">
                                              {/* <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-600" /> */}
                                            </span>
                                          </span>
                                          <span className="ml-4 flex min-w-0 flex-col">
                                            <span className="text-sm font-medium text-gray-500">{step.name}</span>
                                            <span className="text-sm text-gray-500">{step.description}</span>
                                          </span>
                                        </a>
                                      </>
                                    )}
                                  </li>
                                ))}
                              </ol>
                            </nav>
                          </div>
                        </div>

                        <div className="mt-12 sm:mt-6 md:mt-12 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-4">
                          <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-pink-600 hover:bg-pink-600/80 px-8 py-4 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 sm:col-start-2"
                            onClick={() => setOpen(false)}
                          >
                            Try Again
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-transparent opacity-70 hover:opacity-95 px-8 py-4 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 sm:col-start-1 sm:mt-0"
                            onClick={() => setOpen(false)}
                            ref={cancelButtonRef}
                          >
                            Cancel
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

    </div>
  );
}
