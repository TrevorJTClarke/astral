import { Fragment, useState, useEffect } from "react";
import { Dialog, Disclosure, Menu, Popover, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { useRouter } from 'next/router';
import Link from 'next/link';
import BigNumber from 'bignumber.js';
import { AssetList, Asset, Chain } from '@chain-registry/types';
import { useChain, useManager } from '@cosmos-kit/react';
import { contracts, stargaze } from 'stargazejs';
import { AllNftInfoResponse } from "stargazejs/types/codegen/SG721Base.types";
import { useQuery, useLazyQuery } from '@apollo/client';
import Loader from '../components/loader'
import NftImage from '../components/nft-image'
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
  OWNEDTOKENS,
  exponent,
  getHttpUrl,
  toDisplayAmount,
  getChainForAddress,
  marketInfo,
} from '../config'
import {
  availableNetworks,
  getBridgeContractsForChainId,
} from '../contexts/connections'
import {
  queryNftContractsMsg,
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

// cache the query clients
const clients: any = {}

export default function MyNfts() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [selectedChains, setSelectedChains] = useState<ChainSelectable[]>([]);
  const [nfts, setNfts] = useState<any[]>([]);
  const [ownerAddresses, setOwnerAddresses] = useState<any>({});
  const [getOwnedTokens, ownedTokensQuery] = useLazyQuery<OwnedTokens>(OWNEDTOKENS);

  // dynamic wallet/client connections
  const manager = useManager()
  // console.log('manager', manager);
  const { address } = useChain(chainName)
  console.log('address', address);

  const updateSelectedChains = (chain: ChainSelectable, idx: number) => {
    if (selectedChains[idx].selected != chain.selected) return;
    const updatedChains = selectedChains.map((c, i) => {
      if (i === idx) c.selected = !chain.selected
      return c
    })
    setSelectedChains(updatedChains)
  }

  const getOwnedNFTs = async () => {
    if (!Object.keys(ownerAddresses).length) return;
    console.log('getOwnedNFTs!!!!!!!!!!!!!!!!!!!!!', Object.keys(ownerAddresses).length, 'networks')

    // NOTE: This only works for stargaze!!!
    if (ownerAddresses['elgafar-1'] || ownerAddresses['stargaze-1']) getOwnedTokens({
      variables: {
        owner: ownerAddresses['elgafar-1'] || ownerAddresses['stargaze-1'],
        // filterForSale: null,
        // sortBy: "PRICE_ASC",
        limit: 100
      },
    });

    // Get all bridge contract addresses & their NFT addresses
    let nftContracts: any = {}
    for await (const chain_id of Object.keys(ownerAddresses)) {
      const bridgeContracts = getBridgeContractsForChainId(chain_id)
      console.log('bridgeContracts', chain_id, bridgeContracts)

      // Query each bridge for its NFT contracts
      bridgeContracts.forEach(async addr => {
        console.log('---- clients[chain_id]', chain_id, clients[chain_id], clients)
        if (clients[chain_id]) try {
          const contract_addr = await clients[chain_id].queryContractSmart(addr, queryNftContractsMsg())
          console.log('contract_addr', contract_addr)
          if (contract_addr) nftContracts[chain_id] = contract_addr
        } catch (e) {
          console.log('bridgeContracts NFT getter e', e)
        }
      })
    }
  };

  const getData = async () => {
    setIsLoading(true);
    await Promise.all([getOwnedNFTs()]);
    setIsLoading(false);
  };

  useEffect(() => {
    console.log('ownedTokensQuery!!!!!!!!!!!!!!!!!!!!!', ownedTokensQuery.variables.owner, ownedTokensQuery)
    if (ownedTokensQuery?.data?.tokens?.tokens) {
      // adjust output for better UI facilitation
      const { tokens } = ownedTokensQuery.data.tokens
      console.log('tokens', tokens);
      const adjustedTokens: any[] = tokens.map(tkn => {
        let t = {...tkn}
        t.chain = getChainForAddress(t.collectionAddr)
        return t
      })
      console.log('adjustedTokens', adjustedTokens)

      setNfts(adjustedTokens)
      setHasData(true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedTokensQuery.data]);
  
  useEffect(() => {
    if (!isAuthed) return;
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerAddresses]);

  useEffect(() => {
    // Need to check at least 1 chain is authed
    setIsAuthed(typeof address !== 'undefined')
    if (!address) return;
    (async () => {
      for await (const chain of selectedChains) {
        if (!chain.selected) return;
        const repo = manager.getWalletRepo(chain.chain_name)
        if (repo.current?.address) setOwnerAddresses({ ...ownerAddresses, [`${chain.chain_id}`]: repo.current.address })
        console.log('>> selectedChains getCosmWasmClient', chain.chain_name, repo, repo.current?.address, ownerAddresses)
        clients[chain.chain_id] = await repo.getCosmWasmClient()
      }

      // Check if authed, to show them to connect before checkign NFT holdings
      console.log('Object.keys(ownerAddresses).length > 0', ownerAddresses, Object.keys(ownerAddresses).length, Object.keys(ownerAddresses).length > 0);

      
    })();
 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChains, address]);

  if (!selectedChains.length) setSelectedChains(defaultSelectedNetworks())

  return (
    <div className="mt-12 mb-24">
      <div className="flex justify-between px-8">
        <h1 className="text-center text-3xl font-semibold xl:text-5xl">
          My NFTs
        </h1>

        <Popover.Group className="hidden sm:flex sm:items-baseline sm:space-x-8">
          <Popover as="div" className="relative inline-block text-left">
            <div>
              <Popover.Button className="group p-4 inline-flex items-center justify-center text-sm font-medium text-gray-300 hover:text-gray-100 ring-0 focus:ring-transparent">
                <span>Active Networks</span>
                <span className="ml-1.5 rounded bg-gray-600 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-200">
                  {selectedChains.filter(s => s.selected).length}
                </span>
                <ChevronDownIcon
                  className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                  aria-hidden="true"
                />
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

      {(isLoading && isAuthed) && (<div className="relative mx-auto mb-24 text-center text-white">
        <Loader />
        <h2 className="text-2xl animate-pulse">Loading NFTs...</h2>
      </div>)}

      {(!isLoading && !isAuthed) && (<div className="my-24 mx-auto text-center text-white">
        <h2 className="text-xl mb-4">No Account Logged In!</h2>
        <p className="text-md text-gray-500 mt-4">Please connect your wallet above!</p>
      </div>)}

      {(!isLoading && isAuthed && !hasData) && (<div className="flex flex-col my-24 mx-auto text-center text-white">
        <h2 className="text-xl mb-4">No NFTs Found!</h2>
        <p className="text-md text-gray-500 mt-4">Looks like you don't have any NFTs yet, go get some on:</p>
        <div className="flex max-w-1/2 mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {marketInfo.map((m, idx) => (
              <a key={idx} href={m.marketLink} target="_blank" className="inline-flex mt-8 mb-4 items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white border-2 border-pink-600 hover:border-pink-600/80">
                <img src={m.logoPath} alt={m.name} className="w-[200px]" width="100%" />
              </a>
            ))}
          </div>
        </div>
      </div>)}

      {(!isLoading && isAuthed && hasData) && (
        <div className="relative px-4 pt-4 sm:mx-8 sm:pt-8 md:px-0">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4">
            {nfts.map((nft, idx) => (
              <div key={idx} className="group relative h-full overflow-hidden bg-white transition-shadow divide-y rounded-lg shadow-sm divide-neutral-300 hover:shadow-md dark:divide-zinc-800 dark:bg-black group/card border border-zinc-800 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2">
                <Link className="z-[2] focus:outline-none" href={'my-nfts/' + nft.collectionAddr + '/' + nft.tokenId}>
                  <div className="relative bg-neutral-50 dark:bg-black">
                    <div>
                      <NftImage uri={nft.imageUrl} alt={nft.name} />
                    </div>
                    <div className="transition-transition-all -mb-4 group-hover:mb-0 duration-300 opacity-0 group-hover:opacity-100 flex justify-between inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 lg:absolute lg:pt-24">
                      <div className="relative w-9/12">
                        <p className="truncate text-lg font-semibold text-black drop-shadow-xl dark:text-white sm:text-2xl">{nft.name}</p>
                      </div>

                      {nft?.chain?.logo_URIs?.png && (
                        <div>
                          <div className="flex -space-x-4 overflow-hidden p-1">
                            <img
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-transparent"
                              src={nft.chain.logo_URIs.png}
                              alt={nft.chain.pretty_name}
                            />
                          </div>
                        </div>
                      )}
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
