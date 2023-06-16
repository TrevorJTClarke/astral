/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router';
import { useCallback, Fragment, useState, useMemo, useRef, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import { AssetList, Asset, Chain } from '@chain-registry/types';
import { CosmWasmSigner, Link } from '@confio/relayer';
import { OfflineSigner } from "@cosmjs/proto-signing";
import { StdFee } from '@cosmjs/stargate';
import { Dialog, Disclosure, Listbox, Transition } from '@headlessui/react'
import { useManager } from '@cosmos-kit/react';
import NftImage from './nft-image'
import NftLoader from './nft-loader'
import {
  ArrowSmallRightIcon,
  ArrowPathIcon,
  CheckIcon,
  PaperAirplaneIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import {
  availableNetworks,
  isAvailableNetwork,
  extendedChannels,
  NFTChannel,
  NFTChannelChain,
  isBridgeAddress,
  getContractFromPort,
} from '../contexts/connections'
import {
  getMsgSendIcsNft,
} from '../contexts/ics721'
import {
  classNames,
  getHttpUrl,
  getMarketForAddress,
  getChainAssets,
  getChainForAddress,
} from '../config'
import { getLinkForChannel } from '../contexts/ibc';

export declare type Dispatch<T> = (value: T) => void;
export interface TransferModalTypes {
  isOpen: boolean
  setOpen: Dispatch <boolean>
  imageUrl: string
}

export enum TransferView {
  Setup,
  Sending,
  Complete,
  RequiresRelayer,
  Error,
}

const allSteps = [
  { name: 'IBC Send', href: '#', status: 'current', description: 'Origin network sent asset' },
  { name: 'IBC Receive', href: '#', status: 'upcoming', description: 'Destination network received asset' },
  { name: 'IBC Confirm', href: '#', status: 'upcoming', description: 'Origin network acknowledged asset receipt' },
]

export enum RelayerView {
  SrcInit,
  DestAck,
  SrcConfirm,
  Error,
}


// MsgUpdateClient (DEST)
// MsgRecvPacket (DEST)
// MsgUpdateClient (SRC)
// MsgAcknowledgement (SRC)
// DONE! :D
const allRelayerSteps = [
  { name: 'Initialize Proof', href: '#', status: 'current', description: 'Source network submits proof to destination' },
  { name: 'Acknowledge Proof', href: '#', status: 'upcoming', description: 'Destination network confirms proof' },
  { name: 'Confirm Transfer', href: '#', status: 'upcoming', description: 'Source network confirms transfer complete' },
]

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function TransferModal({
  isOpen,
  setOpen,
  imageUrl,
}: TransferModalTypes) {
  const router = useRouter()
  const { query } = router
  const cancelButtonRef = useRef(null)
  const [srcNetwork, setSrcNetwork] = useState<Chain | undefined>()
  const [destNetwork, setDestNetwork] = useState<Chain | undefined>()
  const [availableChannels, setAvailableChannels] = useState<NFTChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<NFTChannel | undefined>()
  const [currentView, setCurrentView] = useState<TransferView>(TransferView.Setup);
  const [currentSteps, setCurrentSteps] = useState(allSteps);
  const [currentIbcStep, setCurrentIbcStep] = useState(0);
  const [receiver, setReceiver] = useState('');
  const [destNftClassId, setDestNftClassId] = useState<string | undefined>();

  // self-relay
  const [link, setLink] = useState<Link | undefined>();
  const [relayRunning, setRelayRunning] = useState<boolean>(false);
  const [relayerSteps, setRelayerSteps] = useState(allRelayerSteps);
  const [currentRelayerStep, setCurrentRelayerStep] = useState(0);

  // router fun
  const navigateToNft = async () => {
    // TODO: Remove once below is finished, for now hackys
    router.replace(`/my-nfts`)
    // TODO:!
    // try {
    //   const destContract = `${}`
    //   router.replace(`/my-nfts/${destContract}/${query.tokenId}`)
    // } catch (e) {
    //   // 
    // }
    // setOpen(false)
  }

  // dynamic wallet/client connections
  const manager = useManager()

  useEffect(() => {
    if (!srcNetwork && query.collection) {
      const srcChain = getChainForAddress(`${query.collection}`)
      if (srcChain?.chain_id && isAvailableNetwork(srcChain.chain_id)) {
        setSrcNetwork(srcChain)
        if (!destNetwork) setDestNetwork(srcChain)
      }
    }
  }, [query.collection]);

  useEffect(() => {
    if (!isOpen) {
      setRelayRunning(false)
      setCurrentView(TransferView.Setup)
    }
  }, [isOpen]);

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
    if (!srcNetwork?.chain_id) return;
    // filter to channels only for selected network and base network
    const chain_id = srcNetwork.chain_id
    const foundChannels: NFTChannelChain[] = []

    // TODO: Filter to src + dest channels
    // TODO: dynamically get channels from RPC
    extendedChannels.forEach(channels => {
      Object.keys(channels).forEach((k: string) => {
        if (chain_id === channels[k].chain_id) foundChannels.push(channels[k])
      })
    })
    console.log('TODO: srcNetwork, foundChannels', srcNetwork, foundChannels)

    setAvailableChannels(foundChannels)
    if (foundChannels.length > 0) setSelectedChannel(foundChannels[0])
  }, [destNetwork]);

  const startTransfer = async () => {
    setCurrentView(TransferView.Sending)
    await submitTransfer()
  }

  // TODO: submitSend function (same-chain NFT send)

  const submitTransfer = async () => {
    const nftContractAddr = query.collection
    if (!nftContractAddr) {
      setCurrentView(TransferView.Error)
      return;
    }
    const srcChain = getChainForAddress(`${nftContractAddr}`)
    if (!srcChain?.chain_name) {
      setCurrentView(TransferView.Error)
      return;
    }
    const repo = manager.getWalletRepo(srcChain?.chain_name)
    if (repo.isWalletDisconnected) await repo.connect(repo.wallets[0].walletName, true)
    if (!repo.current?.address) {
      setCurrentView(TransferView.Error)
      return;
    }
    const wallet = repo.getWallet(repo.wallets[0].walletName)
    const senderAddr = repo.current?.address
    if (!senderAddr || !wallet) {
      setCurrentView(TransferView.Error)
      return;
    }
    const signerClient = await wallet.getSigningCosmWasmClient();

    let contractPort: string | undefined;
    if (selectedChannel?.port && `${selectedChannel.port}`.search('wasm') > -1) {
      contractPort = `${selectedChannel.port}`.split('.')[1]
    }
    if (!receiver || !selectedChannel?.channel) {
      setCurrentView(TransferView.Error)
      return;
    }

    const destChain = getChainForAddress(receiver)
    if (!destChain?.chain_name) {
      setCurrentView(TransferView.Error)
      return;
    }
    const destRepo = manager.getWalletRepo(destChain?.chain_name)
    const destClient = await destRepo.getCosmWasmClient();
    const sendMsg = await getMsgSendIcsNft(destClient, {
      channel_id: selectedChannel?.channel,
      contract: `${contractPort}`,
      token_id: `${query.tokenId}`,
      receiver,
    })

    try {
      const res = await signerClient.execute(
        senderAddr,
        `${nftContractAddr}`,
        sendMsg,
        'auto',
      );
      console.log('signerClient res', res)
      if (res?.transactionHash) {
        setCurrentIbcStep(1)

        // TODO: Change to wait 10-30s for receive confirm (check receiver is owner)
        // Check packet status for a few seconds before attempting Self-relay
        setTimeout(() => {
          setCurrentView(TransferView.RequiresRelayer)
        }, 2000)
      }
    } catch (e) {
      // display error UI
      console.error('signingCosmWasmClient e', e)
      setCurrentView(TransferView.Error)
    }
  }

  // self-relayer logic ---------
  async function relayerLoop() {
    if (!link) return;
    try {
      // Relay ONCE
      if (link?.relayAll) {
        // await link.relayAll()
        link.relayAll().then(() => {
          setCurrentView(TransferView.Complete)
          setCurrentIbcStep(1)
        })
      }
    } catch (e) {
      console.error(`Caught error: `, e);
      setCurrentView(TransferView.Error)
    }
  }

  async function relayerCheckLoop(poll = 4000) {
    if (!link) return;
    while (relayRunning) {
      try {
        const pendingPktsA = await link.getPendingPackets('A')
        console.log('pendingPktsA', pendingPktsA)
        if (pendingPktsA.length > 0) return setCurrentRelayerStep(1)
        const pendingAcksB = await link.getPendingAcks('B')
        console.log('pendingAcksB', pendingAcksB)
        if (pendingPktsA.length > 0) return setCurrentRelayerStep(2)

        // TODO: check destination owner is receiver, setCurrentRelayerStep(3)
        // TODO: check source owner is signer -- which reverted, setCurrentRelayerStep(4)

        // TODO: Remove! This is hacky check for success!
        if (currentRelayerStep > 0 && !pendingPktsA.length && !pendingAcksB.length) {
          setCurrentRelayerStep(3)
          setRelayRunning(false)
          setTimeout(() => {
            setCurrentView(TransferView.Complete)
            setCurrentIbcStep(1)
          }, 2000)
          break;
        }

      } catch (e) {
        console.error(`Caught error: `, e);
      }
      await sleep(poll)
    }
  }

  const startSelfRelay = async () => {
    try {
      setCurrentRelayerStep(1)
      if (!srcNetwork?.chain_name) {
        setCurrentView(TransferView.Error)
        return;
      }
      const repoA = manager.getWalletRepo(srcNetwork?.chain_name)
      if (repoA.isWalletDisconnected) await repoA.connect(repoA.wallets[0].walletName, true)
      const aSignerWallet = await repoA.getWallet(repoA.wallets[0].walletName)
      if (!aSignerWallet) {
        setCurrentView(TransferView.Error)
        return;
      }
      const aSigner = await aSignerWallet.getSigningCosmWasmClient()
      const aSignerClient: CosmWasmSigner = {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        sign: aSigner,
        senderAddress: repoA.current?.address || '',
      }
      const aOfflineClient: OfflineSigner = aSignerWallet.offlineSigner.keplr.getOfflineSigner(srcNetwork?.chain_id, 'direct')

      const repoB = manager.getWalletRepo(destNetwork?.chain_name)
      if (repoB.isWalletDisconnected) await repoB.connect(repoB.wallets[0].walletName, true)
      const bSignerWallet = await repoB.getWallet(repoB.wallets[0].walletName, true)
      const bSigner = await bSignerWallet.getSigningCosmWasmClient()
      const bSignerClient: CosmWasmSigner = {
        sign: bSigner,
        senderAddress: repoB.current?.address || '',
      }
      const bOfflineClient: OfflineSigner = bSignerWallet.offlineSigner.keplr.getOfflineSigner(destNetwork?.chain_id, 'direct')

      // Get link, before relayer loop
      const linkInst = await getLinkForChannel(
        aSignerClient,
        aOfflineClient,
        bSignerClient,
        bOfflineClient,
        selectedChannel?.port,
        selectedChannel?.channel,
      )

      setLink(linkInst)
      setRelayRunning(true)
    } catch (e) {
      console.error(e)
      setLink(undefined)
      setRelayRunning(false)
      setCurrentView(TransferView.Error)
    }
  }

  useEffect(() => {
    if (link) relayerLoop()
  }, [link])
  useEffect(() => {
    if (link && relayRunning === true) relayerCheckLoop()
  }, [relayRunning])

  useEffect(() => {
    const as = allRelayerSteps.map((s, idx) => {
      if (currentRelayerStep > idx + 1) s.status = 'complete'
      if (currentRelayerStep === idx + 1) s.status = 'current'
      if (currentRelayerStep < idx + 1) s.status = 'upcoming'
      return s
    })
    setRelayerSteps(as)
  }, [currentRelayerStep]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
                            {srcNetwork && (
                              <span className="flex items-center">
                                {srcNetwork?.asset?.logo_URIs?.png && (
                                  <img src={srcNetwork.asset.logo_URIs.png} alt={srcNetwork.pretty_name} className="h-10 w-10 flex-shrink-0 rounded-full" />
                                )}
                                <span className="ml-3 text-xl block truncate">{srcNetwork.pretty_name}</span>
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
                                    {destNetwork && (
                                      <span className="flex items-center">
                                        {destNetwork?.asset?.logo_URIs?.png && (
                                          <img src={destNetwork.asset.logo_URIs.png} alt={destNetwork.pretty_name} className="h-10 w-10 flex-shrink-0 rounded-full" />
                                        )}
                                        <span className="ml-3 text-xl block truncate">{destNetwork.pretty_name}</span>
                                      </span>
                                    )}
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
                                // placeholder={address?.substring(0, 22) + '...'}
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
                        <NftLoader uri={imageUrl} />

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

                      <div className="relative mx-auto min-h-[250px] min-w-[250px] mt-8 text-center text-white">
                        <NftImage className="min-h-[250px] min-w-[250px]" uri={imageUrl} />
                      </div>

                      <div className="mt-12 sm:mt-6 md:mt-12 flex justify-center">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-pink-600 hover:bg-pink-600/80 px-8 py-4 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 sm:col-start-2"
                          onClick={navigateToNft}
                        >
                          <span>Go To NFT</span>
                          <ArrowRightIcon className="ml-2 h-5 w-5 text-white" aria-hidden="true" />
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
                        <NftImage className="min-h-[250px] min-w-[250px]" uri={imageUrl} />

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

                {currentView === TransferView.RequiresRelayer && (
                  <div>
                    <div className="relative mt-0 text-left sm:mt-0">
                      <Dialog.Title as="div" className="text-2xl font-semibold leading-6 text-gray-100">
                        Transfer using Self Relay

                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Your transfer has not been picked up by any relayers, to start your transfer follow prompts below!<br /><strong>NOTE:</strong> You will need to sign multiple transactions for this to work.
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
                        <NftImage className="min-h-[250px] min-w-[250px]" uri={imageUrl} />

                        <div className="my-auto">
                          <nav aria-label="Progress">
                            <ol role="list" className="overflow-hidden pointer-events-none">
                              {relayerSteps.map((step, stepIdx) => (
                                <li key={step.name} className={classNames(stepIdx !== relayerSteps.length - 1 ? 'pb-10' : '', 'relative')}>
                                  {step.status === 'complete' || step.status === 'error' ? (
                                    <>
                                      {stepIdx !== relayerSteps.length - 1 ? (
                                        // <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-pink-600" aria-hidden="true" />
                                        <div className={classNames(step.status === 'error' ? 'bg-gray-600' : 'bg-pink-600', 'absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5')} aria-hidden="true" />
                                      ) : null}
                                      <a href={step.href} className="group relative flex items-start">
                                        <span className="flex h-9 items-center">
                                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-pink-600">
                                            {step.status === 'complete' ? (
                                              <CheckIcon className="h-5 w-5 text-gray-900" aria-hidden="true" />
                                            ) : (
                                              <XMarkIcon className="h-5 w-5 text-gray-900" aria-hidden="true" />
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
                                      {stepIdx !== relayerSteps.length - 1 ? (
                                        <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-600" aria-hidden="true" />
                                      ) : null}
                                      <a href={step.href} className="group relative flex items-start" aria-current="step">
                                        <span className="flex h-9 items-center" aria-hidden="true">
                                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-pink-600 bg-black">
                                            {step.status === 'current' && (
                                              <ArrowPathIcon className="animate-spin h-5 w-5 text-pink-600" aria-hidden="true" />
                                            )}
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
                                      {stepIdx !== relayerSteps.length - 1 ? (
                                        <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-800" aria-hidden="true" />
                                      ) : null}
                                      <a href={step.href} className="group relative flex items-start">
                                        <span className="flex h-9 items-center" aria-hidden="true">
                                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-600 bg-black">
                                            {stepIdx === currentRelayerStep && (
                                              <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-600" />
                                            )}
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
                          onClick={startSelfRelay}
                          disabled={currentRelayerStep !== 0}
                        >
                          {currentRelayerStep !== 0 ? (
                            <>
                              <span>Relaying</span>
                              <ArrowPathIcon className="animate-spin ml-2 h-5 w-5 text-white" aria-hidden="true" />
                            </>
                          ) : (
                            <>
                              <span>Start Relay</span>
                              <ArrowsUpDownIcon className="ml-2 h-5 w-5 text-white" aria-hidden="true" />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-transparent opacity-70 hover:opacity-95 px-8 py-4 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 sm:col-start-1 sm:mt-0"
                          onClick={() => setOpen(false)}
                          ref={cancelButtonRef}
                          disabled={currentRelayerStep !== 0}
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
  );
};
