import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Disclosure, Menu, Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/router';
import Link from 'next/link';
import BigNumber from 'bignumber.js';
import { AssetList, Asset, Chain } from '@chain-registry/types';
import { useChain, useManager } from '@cosmos-kit/react';
import { useAccount } from 'wagmi'
import { contracts, stargaze } from 'stargazejs';
import { AllNftInfoResponse } from "stargazejs/types/codegen/SG721Base.types";
import { useQuery, useLazyQuery, useApolloClient, ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import Loader from '../components/loader'
import NftImage from '../components/nft-image'
import {
  Squares2X2Icon,
  StopIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  Collection,
  Collections,
  ContractsAddress,
  Minter,
  SG721,
  TData,
  Token,
  TransactionResult,
  Whitelist,
  OwnedTokens,
} from '../components/types'
import {
  chainName,
  coin,
  COLLECTION,
  COLLECTIONS,
  OWNEDTOKENS_STARGAZE,
  OWNEDTOKENS_ETHEREUM,
  exponent,
  getHttpUrl,
  toDisplayAmount,
  getChainForAddress,
  getChainAssets,
  marketInfo,
  disallowedNFTFormats,
} from '../config'
import {
  availableNetworks,
  getBridgeContractsForChainId,
} from '../contexts/connections'
import {
  queryNftContractsMsg,
  queryNftOwnerTokensMsg,
  queryNftTokenInfoMsg,
  getNftOwnerTokens,
  QueryChainAddresses,
} from '../contexts/ics721'

export interface ChainSelectable extends Chain {
  selected?: boolean
}

const defaultSelectedNetworks = (): ChainSelectable[] => {
  return availableNetworks.map(a => {
    a.selected = true
    return a
  })
}

const apolloUriEthereum = process.env.NEXT_PUBLIC_APOLLO_URI_ETHEREUM || ''
const clientEthereum = new ApolloClient({
  uri: apolloUriEthereum,
  cache: new InMemoryCache(),
});

// cache the query clients
const clients: any = {}

export default function MyNfts() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState(2)
  const [hasData, setHasData] = useState(false);
  const [selectedChains, setSelectedChains] = useState<ChainSelectable[]>([]);
  const [nfts, setNfts] = useState<any[]>([]);
  const [ownerAddresses, setOwnerAddresses] = useState<QueryChainAddresses>({});
  const [getOwnedTokensStargaze, ownedTokensStargazeQuery] = useLazyQuery<OwnedTokens>(OWNEDTOKENS_STARGAZE);
  const [getOwnedTokensEthereum, ownedTokensEthereumQuery] = useLazyQuery(OWNEDTOKENS_ETHEREUM, { client: clientEthereum })
  const [activeSort, setActiveSort] = useState('Token Name');
  const [filterInput, setFilterInput] = useState('')
  
  function setTab(id) {
    if (activeTab != id) setActiveTab(id)
  }

  function handleFilter(e) {
    setFilterInput(`${e.target.value}`.toLowerCase())
  }

  const filterByInputText = (item) => {
    if (!filterInput) return true
    if (`${item.name}`.toLowerCase().includes(filterInput) || `${item.token_id}`.toLowerCase().includes(filterInput)) {
      return true
    }
  }

  const compareActiveSort = (a, b) => {
    if (activeSort == 'Token Id') return a.token_id - b.token_id
    if (activeSort == 'Token Name') return a.name.localeCompare(b.name)
  }

  // dynamic wallet/client connections
  const manager = useManager()
  const { address } = useChain(chainName)
  const ethAccount = useAccount()

  const updateSelectedChains = (chain: ChainSelectable, idx: number) => {
    if (selectedChains[idx].selected != chain.selected) return;
    const updatedChains = selectedChains.map((c, i) => {
      if (i === idx) c.selected = !chain.selected
      return c
    })
    setSelectedChains(updatedChains)
  }

  const getOwnedNFTsStargaze = async () => {
    if (!Object.keys(ownerAddresses).length) return;
    // NOTE: This only works for stargaze!!!
    if (ownerAddresses['elgafar-1'] || ownerAddresses['stargaze-1']) {
      const ownerAddrs = ownerAddresses['elgafar-1'] || ownerAddresses['stargaze-1']
      ownerAddrs.forEach(owner => {
        getOwnedTokensStargaze({
          variables: {
            owner,
            // filterForSale: null,
            // sortBy: "PRICE_ASC",
            limit: 100
          },
        })
      })
    }

    const allNfts = await getNftOwnerTokens(clients, ownerAddresses)
    if (!allNfts.length) return;
    const adjustedNfts: any[] = allNfts.filter(n => n != 'undefined').map(nft => {
      let n = { ...nft }
      n.chain = getChainForAddress(n.collection_addr)
      n.href = `my-nfts/${n.collection_addr}/${n.id}`
      n.token_id = n.id
      if (n.chain) {
        const assetList = getChainAssets(n.chain)
        n.asset = assetList?.assets ? assetList.assets[0] : null
      }
      return n
    })

    applyDedupeNfts(adjustedNfts)
  }

  const getOwnedNFTsEth = async () => {
    const owner = ethAccount.address
    if (owner) getOwnedTokensEthereum({
      client: clientEthereum,
      variables: {
        owner,
        limit: 20
      },
    })
  }

  const annotateNftsCosmos = async () => {
    if (ownedTokensStargazeQuery?.data?.tokens?.tokens) {
      // adjust output for better UI facilitation
      const { tokens } = ownedTokensStargazeQuery.data.tokens
      if (!tokens.length) return;
      const adjustedTokens: any[] = tokens.map(tkn => {
        let t = { ...tkn }
        t.chain = getChainForAddress(t.collectionAddr)
        t.href = `my-nfts/${t.collectionAddr}/${t.tokenId}`
        t.collection_addr = t.collectionAddr
        t.token_id = t.tokenId
        if (t.chain) {
          const assetList = getChainAssets(t.chain)
          t.asset = assetList?.assets ? assetList.assets[0] : null
        }
        return t
      })
      applyDedupeNfts(adjustedTokens)
    }
  }

  const annotateNftsEthereum = async () => {
    if (ownedTokensEthereumQuery?.data?.tokens?.nodes) {
      // adjust output for better UI facilitation
      const { nodes } = ownedTokensEthereumQuery.data.tokens
      if (!nodes.length) return
      const adjustedTokens: any[] = nodes.map(tkn => {
        let t = { ...tkn.token }
        t.chain = {
          chain_id: 'ethereummainnet',
          chain_name: 'ethereum',
          pretty_name: 'Ethereum',
          bech32_prefix: '0x',
        }
        t.asset = {
          base: '0x',
          name: 'Ethereum',
          display: 'ethereum',
          symbol: 'ETH',
          logo_URIs: {
            // svg: '',
            png: '/logos/ethereum-logo.png',
          },
        }
        // image adjust for computed onchain images!
        if (t.image.url && t.image.mimeType === 'image/svg+xml') {
          t.backgroundUrl = `url('${t.image.url}')`
        } else if (t.image.url !== null && !t.imageUri) {
          t.imageUrl = t.image.url
        } else if (t.content.url !== null && !t.imageUri) {
          t.imageUrl = t.content.url
        }
        t.collection_addr = t.collectionAddress
        t.token_id = t.tokenId
        t.href = `my-nfts/${t.collection_addr}/${t.token_id}`
        return t
      }).filter(t => !disallowedNFTFormats.includes(t.tokenUrlMimeType))
      applyDedupeNfts(adjustedTokens)
    }
  }

  const getData = async () => {
    setIsLoading(true);
    await Promise.all([getOwnedNFTsStargaze(), getOwnedNFTsEth()]);
    setIsLoading(false);
  };

  const filterNftsBySelectedChains = (nft: any) => {
    if (!selectedChains.length || !nft?.chain?.chain_id) return 
    return selectedChains.filter(c => c.selected).map(c => c.chain_id).includes(nft.chain.chain_id)
  }

  const applyDedupeNfts = (newNfts: any[]) => {
    setNfts((prevNfts: any[]) => {
      const dedupedNfts: any[] = prevNfts || []
      
      if (!newNfts.length) {
        if (prevNfts) setHasData(prevNfts.length > 0)
        return dedupedNfts;
      }

      newNfts.forEach((newTkn: any) => {
        let has = false
        if (prevNfts && prevNfts.length > 0) prevNfts.forEach(nft => {
          if (nft.collection_addr === newTkn.collection_addr && nft.token_id === newTkn.token_id) has = true
        })
        if (!has) dedupedNfts.push(newTkn)
      })
      if (dedupedNfts.length > 0) setHasData(true)
      return dedupedNfts
    })
  }

  useEffect(() => {
    annotateNftsCosmos()
  }, [ownedTokensStargazeQuery.data]);
  
  useEffect(() => {
    annotateNftsEthereum()
  }, [ownedTokensEthereumQuery.data]);
  
  useEffect(() => {
    if (!isAuthed) return;
    if (isLoadingProviders) return;
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProviders, isAuthed, ownerAddresses]);

  // For Cosmos
  useEffect(() => {
    // Need to check at least 1 chain is authed
    if (!isAuthed && isAuthed !== (typeof address !== 'undefined')) setIsAuthed(typeof address !== 'undefined')
    if (!address) {
      setIsLoading(false)
      return;
    }
    // reset owner holdings if watched address changes
    if (!ownerAddresses[address]) {
      setNfts([])
      setHasData(false)
    }

    (async () => {
      setIsLoading(true)
      setIsLoadingProviders(true)
      for await (const chain of selectedChains) {
        if (!chain.selected) ownerAddresses[chain.chain_id] = []
        else if (chain.chain_id != 'ethereummainnet') {
          const repo = manager.getWalletRepo(chain.chain_name)
          if (repo.isWalletDisconnected) await repo.connect(repo.wallets[0].walletName, true)
          if (repo.current?.address) {
            const newAddresses = [repo.current.address]
            ownerAddresses[chain.chain_id] = newAddresses
          }
          clients[chain.chain_id] = await repo.getCosmWasmClient()
        }
      }
      
      setOwnerAddresses(ownerAddresses)
      setIsLoadingProviders(false)
    })();
 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, router]);

  // For Ethereum
  useEffect(() => {
    // Need to check at least 1 chain is authed
    if (!isAuthed && isAuthed !== (typeof ethAccount.address !== 'undefined')) setIsAuthed(typeof ethAccount.address !== 'undefined')
    if (!ethAccount.address) {
      setIsLoading(false)
      return;
    }
    (async () => {
      setIsLoading(true)
      setIsLoadingProviders(true)
      setOwnerAddresses(prev => {
        const n: any = {}
        n.ethereummainnet = [ethAccount.address]
        return { ...prev, ...n }
      })
      setIsLoadingProviders(false)
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ethAccount.address, router]);

  if (!selectedChains.length) setSelectedChains(defaultSelectedNetworks())

  return (
    <div className="relative min-h-window pt-12 pb-24">
      <div className="z-30 fixed top-24 w-full flex justify-between px-8 py-4 bg-black/80 backdrop-blur-lg">
        <h1 className="text-center text-3xl font-semibold my-auto">
          My NFTs
        </h1>

        <div className="flex gap-4">
          <div className="flex my-auto">
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-zinc-500 dark:text-zinc-400 sm:text-sm">
                  <MagnifyingGlassIcon className="m-auto w-4 h-4" />
                </span>
              </div>
              <input aria-describedby="" className="block  w-full rounded bg-white shadow-sm dark:bg-zinc-900 sm:text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-pink-500 focus:ring-0 focus:ring-offset-0 border-zinc-300 focus:border-zinc-300 dark:border-zinc-800 dark:focus:border-zinc-800 pl-9" id="nft_filter" type="text" autoComplete="on" placeholder="Filter by name or id" defaultValue="" onChange={handleFilter} />
            </div>
          </div>
          <nav className="flex my-auto cursor-pointer">
            <div onClick={() => setTab(1)} className={
              activeTab == 1 ? 'flex text-white bg-pink-600 rounded-l whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-pink-600' : 'flex text-white rounded-l hover:bg-zinc-800 whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-zinc-800'
            }>
              <StopIcon className="m-auto w-4 h-4" />
            </div>
            <div onClick={() => setTab(2)} className={
              activeTab == 2 ? 'flex text-white bg-pink-600 rounded-none whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-l-0 border-pink-600' : 'flex text-white rounded-none hover:bg-zinc-800 whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-l-0 border-zinc-800'
            }>
              <Squares2X2Icon className="m-auto w-4 h-4" />
            </div>
            <div onClick={() => setTab(3)} className={
              activeTab == 3 ? 'flex text-white bg-pink-600 rounded-r whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-l-0 border-pink-600' : 'flex text-white rounded-r hover:bg-zinc-800 whitespace-nowrap p-2.5 text-sm font-medium border border-1 border-l-0 border-zinc-800'
            }>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 -0.5 21 21" className="m-auto h-4 w-4 p-[1px]"><path fillRule="evenodd" d="M16.8 18h2.1v-2h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2v-2c0-1.105-.94-2-2.1-2Zm-9.45 4h2.1v-2h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2v-2c0-1.105-.94-2-2.1-2ZM2.1 18h2.1v-2H2.1v2Zm2.1-4H2.1C.94 14 0 14.895 0 16v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2v-2c0-1.105-.94-2-2.1-2Zm12.6-3h2.1V9h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V9c0-1.105-.94-2-2.1-2Zm-9.45 4h2.1V9h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V9c0-1.105-.94-2-2.1-2ZM2.1 11h2.1V9H2.1v2Zm2.1-4H2.1C.94 7 0 7.895 0 9v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V9c0-1.105-.94-2-2.1-2Zm12.6-3h2.1V2h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V2c0-1.105-.94-2-2.1-2ZM9.45 4h2.1V2h-2.1v2Zm2.1-4h-2.1c-1.16 0-2.1.895-2.1 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V2c0-1.105-.94-2-2.1-2ZM2.1 4h2.1V2H2.1v2Zm2.1-4H2.1C.94 0 0 .895 0 2v2c0 1.104.94 2 2.1 2h2.1c1.16 0 2.1-.896 2.1-2V2c0-1.105-.94-2-2.1-2Z"></path></svg>
            </div>
          </nav>

          <div className="flex shrink-0 items-center justify-end">
            <Menu as="div" className="relative text-left inline-block">
              <Menu.Button className="flex-none items-center border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white dark:hover:bg-zinc-900 inline-flex w-full justify-center rounded-md !border-zinc-800 bg-black/20 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                Sort By: {activeSort}
                <ChevronDownIcon className="m-auto ml-2 w-6 h-6" />
              </Menu.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Menu.Items className="absolute right-0 z-[100] mt-2 origin-top-right rounded-md border border-zinc-800 bg-black p-2 shadow-lg ring-1 ring-black/5 focus:outline-none w-48 transform opacity-100 scale-100">
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => setActiveSort('Token Id')} className="text-white group flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-pink-600">
                        {activeSort == 'Token Id' && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="mr-1.5 h-4 w-4 stroke-2 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg>
                        )}
                        Token Id
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => setActiveSort('Token Name')} className="text-white group flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-pink-600">
                        {activeSort == 'Token Name' && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="mr-1.5 h-4 w-4 stroke-2 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path></svg>
                        )}
                        Token Name
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          <Popover.Group className="hidden sm:flex sm:items-baseline sm:space-x-8 my-auto">
            <Popover as="div" className="relative inline-block text-left">
              <div>
                <Popover.Button className="group px-4 py-2 inline-flex items-center justify-center text-sm font-medium text-white hover:text-gray-100 ring-0 focus:ring-transparent border border-1 rounded border-zinc-800 hover:bg-zinc-900">
                  <span>Active Networks</span>
                  <span className="ml-1.5 rounded bg-gray-600 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-200">
                    {selectedChains.filter(s => s.selected).length}
                  </span>
                  <ChevronDownIcon className="m-auto ml-2 w-6 h-6 text-white" />
                </Popover.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Popover.Panel className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-gray-900 p-4 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <form className="space-y-4">
                    {selectedChains.map((option, optionIdx) => (
                      <div key={option.chain_id} className="flex items-center">
                        <input
                          id={`filter-${option.chain_id}-${optionIdx}`}
                          name={`${option.chain_name}[]`}
                          defaultChecked={option.selected}
                          onChange={() => { updateSelectedChains(option, optionIdx) }}
                          type="checkbox"
                          className="h-4 w-4 rounded border-black text-pink-600 focus:ring-transparent"
                        />
                        <label
                          htmlFor={`filter-${option.chain_id}-${optionIdx}`}
                          className="ml-3 whitespace-nowrap pr-6 text-sm font-medium text-gray-100"
                        >
                          {option.pretty_name}
                        </label>
                      </div>
                    ))}
                  </form>
                </Popover.Panel>
              </Transition>
            </Popover>
          </Popover.Group>
        </div>
      </div>

      {((isLoading || isLoadingProviders) && isAuthed) && (<div className="relative mx-auto mb-24 text-center text-white">
        <Loader />
        <h2 className="text-2xl animate-pulse">Loading NFTs...</h2>
      </div>)}

      {(!isLoading && !isLoadingProviders && !isAuthed) && (<div className="my-24 mx-auto text-center text-white">
        <h2 className="text-xl mb-4">No Account Logged In!</h2>
        <p className="text-md text-gray-500 mt-4">Please connect your wallet above!</p>
      </div>)}

      {(!isLoading && !isLoadingProviders && isAuthed && (nfts.filter(filterNftsBySelectedChains).filter(filterByInputText).length <= 0)) && (<div className="flex flex-col my-24 mx-auto text-center text-white">
        <h2 className="text-xl mb-4">No NFTs Found!</h2>
        <p className="text-md text-gray-500 mt-4">Looks like you don&apos;t have any NFTs yet, go get some on:</p>
        <div className="flex max-w-1/2 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
            {marketInfo.map((m, idx) => (
              <a key={idx} href={m.marketLink} target="_blank" title={m.name} rel="noreferrer" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white border-2 border-pink-600 hover:border-pink-600/80">
                <img src={m.logoPath} alt={m.name} className="max-h-24 min-h-[80px] min-w-[100px] max-w-[200px]" width="" />
              </a>
            ))}
          </div>
        </div>
      </div>)}

      {(!isLoading && !isLoadingProviders && isAuthed && (nfts.filter(filterNftsBySelectedChains).filter(filterByInputText).length > 0)) && (
        <div className="relative z-10 px-4 pt-4 sm:mx-8 sm:pt-8 md:px-0">
          <div className={[
            activeTab == 1 ? ' grid grid-cols-2 gap-4 lg:grid-cols-4 ' : ' ',
            activeTab == 2 ? ' grid grid-cols-3 gap-4 lg:grid-cols-5 ' : ' ',
            activeTab == 3 ? ' grid grid-cols-4 gap-4 lg:grid-cols-6 ' : ' ',
          ].join(' ')}>
            {nfts.filter(filterNftsBySelectedChains).filter(filterByInputText).sort(compareActiveSort).map((nft, idx) => (
              <div key={idx} className="group cursor-pointer relative h-full overflow-hidden bg-white transition-shadow divide-y rounded-lg shadow-sm divide-neutral-300 hover:shadow-md dark:divide-zinc-800 dark:bg-black group/card border border-zinc-800 focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2">
                <Link className="z-[2] focus:outline-none" href={`${nft.href}`}>
                  <div className="relative bg-neutral-50 dark:bg-black">
                    <div>
                      <NftImage uri={nft.imageUrl} alt={nft.name} backgroundUrl={nft.backgroundUrl} />
                    </div>
                    <div className="transition-transition-all -mb-2 group-hover:mb-0 duration-300 opacity-80 group-hover:opacity-100 flex inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 lg:absolute lg:pt-24">
                      {nft?.asset?.logo_URIs?.png && (
                        <div className="flex flex-none my-auto mr-2 w-6 min-w-6 h-6 overflow-hidden">
                          <img
                            className="inline-block h-6 w-6 rounded-full"
                            src={nft.asset.logo_URIs.png}
                            alt={nft.chain.pretty_name}
                          />
                        </div>
                      )}
                      <div className="relative max-w-full pr-4">
                        <p className="truncate text-lg font-semibold text-black drop-shadow-xl dark:text-white sm:text-2xl">{nft.name}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
