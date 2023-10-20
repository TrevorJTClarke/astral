/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { useRouter } from 'next/router';
import { Fragment, useState, useEffect } from 'react';
import { Chain } from '@chain-registry/types';
import type { Dispatch } from './TransferModal'
import { Dialog, Disclosure, Listbox, Transition } from '@headlessui/react'
import { useManager } from '@cosmos-kit/react';
import { GasPrice, calculateFee, StdFee } from "@cosmjs/stargate"
import { fromBech32 } from "@cosmjs/encoding"
import {
  ArrowSmallRightIcon,
  CheckIcon,
  PaperAirplaneIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import {
  availableNetworks,
  isAvailableNetwork,
  extendedChannels,
  NFTChannel,
  NFTChannelChain,
  getDestChannelFromSrc,
} from '../../contexts/connections'
import {
  queryICSBridgeProxy,
  queryICSBridgeIncomingChannels,
  queryICSBridgeOutgoingChannels,
  queryNftClassIdMsg,
  queryNftContractMsg,
  queryNftOwnerOfMsg,
  getMsgApproveIcsProxy,
  getMsgProxySendIcsNft,
  getMsgSendIcsNft,
  queryICSProxyConfig,
  isValidAddress,
  parseClassId,
  joinClassId,
  getAddrFromPort,
} from '../../contexts/ics721'
import {
  classNames,
  getChainForAddress,
  getLogFromError,
} from '../../config'
import { TransferView } from './index'
import TransferProgress from './TransferProgress';

function calcFee(gasLimit: number, gas_price: string): StdFee | undefined {
  if (!gas_price) return;
  const gasPrice = GasPrice.fromString(`${gas_price}`)
  if (!gasPrice) return;

  // Fee: (gas / exponent * price) example: 635024/1000000*0.04 = 0.025401 units
  return calculateFee(gasLimit, gasPrice)
}

export interface TransferFormTypes {
  setOpen: Dispatch<boolean>
  onSuccess: Dispatch<any>
  onError: Dispatch<any>
  imageUrl?: string
}

let allSteps = [
  { name: 'Sending NFT', href: '#', status: 'current', description: 'Origin network sent asset' },
  { name: 'Receiving NFT', href: '#', status: 'upcoming', description: 'Destination network received asset' },
  { name: 'Confirming NFT', href: '#', status: 'upcoming', description: 'Origin network acknowledged asset receipt' },
]

const approveStep = { name: 'Approve Transfer', href: '#', status: 'current', description: 'Give permission to bridge to send asset' }

export default function TransferForm({
  setOpen,
  onSuccess,
  onError,
  imageUrl,
}: TransferFormTypes) {
  const router = useRouter()
  const { query } = router
  const [srcNetwork, setSrcNetwork] = useState<Chain | undefined>()
  const [destNetwork, setDestNetwork] = useState<Chain | undefined>()
  const [availableChannels, setAvailableChannels] = useState<NFTChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<NFTChannel | undefined>()
  const [showSteps, setShowSteps] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(allSteps);
  const [currentIbcStep, setCurrentIbcStep] = useState(0);
  const [receiver, setReceiver] = useState('');
  const [receiverValid, setReceiverValid] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // keep track of confirmations
  const txns: any[] = []

  // dynamic wallet/client connections
  const manager = useManager()
  const nftContractAddr = query.collection
  const srcChain = getChainForAddress(`${nftContractAddr}`)
  const memo = 'Sent via https://astral.ist'

  useEffect(() => {
    if (!srcNetwork && nftContractAddr) {
      const srcChain = getChainForAddress(`${nftContractAddr}`)
      if (srcChain?.chain_id && isAvailableNetwork(srcChain.chain_id)) {
        setSrcNetwork(srcChain)
        console.log('destNetwork', destNetwork);
        
        if (!destNetwork) setDestNetwork(srcChain)
      }
    }
  }, [query.collection]);

  useEffect(() => {
    // validate the matching networks
    const receiverChain = getChainForAddress(receiver)
    const chain = destNetwork

    // Check the receiver & destination are same, if not, CHANGE?!
    if (receiverChain?.chain_id != chain?.chain_id) return setReceiverValid(false)
    setReceiverValid(isValidAddress(receiver, chain?.bech32_prefix))
  }, [receiver, destNetwork])

  useEffect(() => {
    allSteps.map(s => {
      s.status = 'upcoming'
      return s
    })
    if (requiresApproval && !allSteps.find(s => s.name === 'Approve Transfer')) allSteps.unshift(approveStep)
    const as = allSteps.map((s, idx) => {
      if (currentIbcStep > idx) s.status = 'complete'
      if (currentIbcStep === idx) s.status = 'current'
      if (currentIbcStep < idx) s.status = 'upcoming'
      return s
    })
    setCurrentSteps(as)
  }, [currentIbcStep, requiresApproval]);

  useEffect(() => {
    if (!srcNetwork?.chain_id) return;
    // if network is SAME, no available channels :D
    if (srcNetwork.chain_id === destNetwork?.chain_id) return setAvailableChannels([]);

    // filter to channels only for selected network and base network
    const chain_id = srcNetwork.chain_id
    const dest_chain_id = destNetwork?.chain_id || chain_id
    const foundChannels: NFTChannelChain[] = []

    // TODO: dynamically get channels from RPC
    extendedChannels.forEach(channels => {
      let hasBoth = 0
      let channel
      Object.keys(channels).forEach((k: string) => {
        if (chain_id === channels[k].chain_id) {
          channel = channels[k]
          hasBoth += 1
        }
        if (dest_chain_id === channels[k].chain_id) hasBoth += 1
      })
      if (hasBoth > 1 && channel) foundChannels.push(channel)
    })

    console.log('foundChannels', foundChannels);
    
    setAvailableChannels(foundChannels)
    // TODO: FIX!
    // if (foundChannels.length > 0) setSelectedChannel(foundChannels[0])
  }, [destNetwork]);

  const getSrcSigner = async () => {
    if (!srcChain?.chain_name) {
      return onError({ view: TransferView.Error, errors: ['Source chain not found'] })
    }
    const repo = manager.getWalletRepo(srcChain?.chain_name)
    if (repo.isWalletDisconnected) await repo.connect(repo.wallets[0].walletName, true)
    // await repo.activate()
    if (!repo.current?.address) {
      return onError({ view: TransferView.Error, errors: ['Wallet not active or not found'] })
    }
    const wallet = repo.getWallet(repo.wallets[0].walletName)
    const senderAddr = repo.current?.address
    if (!senderAddr || !wallet) {
      return onError({ view: TransferView.Error, errors: ['Wallet not active or not found'] })
    }
    const signer = await wallet.getSigningCosmWasmClient()
    return {
      signer,
      senderAddr,
    }
  }

  const getDestClient = async () => {
    if (!destNetwork?.chain_name) return null
    const repo = manager.getWalletRepo(destNetwork?.chain_name)
    const wallet = repo.getWallet(repo.wallets[0].walletName)
    if (!wallet) return null
    return wallet.getCosmWasmClient()
  }

  const getNextClassId = async (client, dest) => {
    if (!selectedChannel?.port) return;
    const bridgeContractAddr = selectedChannel.port.split('.')[1]
    let classId

    try {
      const res = await client.queryContractSmart(bridgeContractAddr, queryNftClassIdMsg(`${nftContractAddr}`))
      if (res) classId = res
    } catch (e) {
      //
    }
    if (!classId) return;
    let parsedId = parseClassId(classId)
    console.log('parsedId', parsedId);
    

    // Detect if we're going forward or backward, so we can watch the destination chain for the correct classId & owner
    if (parsedId.length <= 1) {
      parsedId.unshift([dest.port, dest.channel])
      return joinClassId(parsedId)
    }
    const destBech = fromBech32(getAddrFromPort(dest.port))
    const srcBech = fromBech32(getAddrFromPort(parsedId[1][0]))
    console.log('`${destBech.prefix}` === `${srcBech.prefix}`', `${destBech.prefix}`, `${srcBech.prefix}`);

    if (`${destBech.prefix}` === `${srcBech.prefix}`) parsedId.shift()
    else parsedId.unshift([dest.port, dest.channel])
    console.log('parsedId', parsedId);
    
    return joinClassId(parsedId)
  }

  const loopListener = async (signerClient) => {
    // get the opposite channel client
    const client = await getDestClient()
    if (!client) return
    let destContractAddr
    let ownerFound = false

    const dest = getDestChannelFromSrc(selectedChannel)
    if (!dest) return
    // get bridge contract & class_id
    const destBridgeContractAddr = dest.port.split('.')[1]
    const classId = await getNextClassId(signerClient, dest)
    const loopInterval = 500
    const loopMaxCalls = 60 // (~30 seconds)
    let loopIndex = 0
    console.log('destBridgeContractAddr, classId', destBridgeContractAddr, classId);
    if (!classId) {
      return onError({ view: TransferView.Error, errors: ["Could not confirm transfer on destination network. It's still possible the transfer was successful. Please refresh your collection page in a few minutes before trying another transfer."] })
    }

    const confirmReceived = async () => {
      // Check maximum times, error if exceeds max timeout (potentially prompt self-relay)
      if (loopIndex > loopMaxCalls) {
        // If no contract addr, show the self-relay option
        if (!destContractAddr) return onError({
          view: TransferView.Error,
          canSelfRelay: true,
          srcNetwork,
          destNetwork,
          selectedChannel,
          errors: ["IBC Transfer was not picked up by relayer network. You can do a self-relay to complete the transfer or cancel the transfer by waiting for the timeout."]
        })

        // If we have contract addr but can't get owner for some reason:
        return onError({ view: TransferView.Error, errors: ["Could not confirm transfer on destination network. It's still possible the transfer was successful. Please refresh your collection page before trying another transfer."] })
      }
      // TODO: Assess for back-transfers
      // If no destContractAddr, sleep 500, recurse
      if (!destContractAddr) {
        // request the NFT contract on the dest chain, which confirms its existence and also gives us new link ot redirect user
        try {
          // class_id: wasm.juno1wk9te824s2as29qntdxtcs6fn8y350g6exuw7hldmrrwze6y6ugse8ulfa/channel-583/stars166xr8hy2t6tmzufnjpc6psnm3apgdk8lkayksu4qg4nxkdwr3gvs98wh7h
          // returns contract: juno15khmwa5v7x6sfa5fp3yvhhh9j97enj3jrpdvdw2z8xfm2d6mppcqpqypw8
          // This is then the correct next_url: juno15khmwa5v7x6sfa5fp3yvhhh9j97enj3jrpdvdw2z8xfm2d6mppcqpqypw8/4079 where token_id doesnt change
          const res = await client.queryContractSmart(destBridgeContractAddr, queryNftContractMsg(classId))
          if (res) {
            destContractAddr = res
            setCurrentIbcStep(currentSteps.length - 1)
          }
        } catch (e) {
          // quiet
        }
        if (!destContractAddr) {
          loopIndex++
          return setTimeout(() => {
            confirmReceived()
          }, loopInterval)
        }
      }

      if (destContractAddr && !ownerFound) {
        // Query the dest contract for NFT ownership, if its not null, transfer successful
        try {
          const res = await client.queryContractSmart(destContractAddr, queryNftOwnerOfMsg(`${query.tokenId}`))
          if (res && res.owner) ownerFound = true
        } catch (e) {
          // quiet
        }
        if (!ownerFound) {
          loopIndex++
          return setTimeout(() => {
            confirmReceived()
          }, loopInterval)
        }
      }

      // fire off the onSuccess if all good
      return onSuccess({
        view: TransferView.Success,
        txns,
        nextUrl: `/my-nfts/${destContractAddr}/${query.tokenId}`
      })
    }

    confirmReceived()
  }

  // same-chain NFT send
  const sendDirect = async (signer, senderAddr) => {
    setShowSteps(true)
    setCurrentIbcStep(0)

    const sendMsg = {
      transfer_nft: {
        recipient: receiver,
        token_id: `${query.tokenId}`
      }
    }

    try {
      const res = await signer.execute(
        senderAddr,
        `${nftContractAddr}`,
        sendMsg,
        'auto',
        memo,
      );
      console.log('sendDirect res', res)
      if (res?.transactionHash) {
        txns.push({
          txHash: res?.transactionHash,
          data: res,
          type: 'direct',
        })
        onSuccess({ view: TransferView.Success, txns })
      }
    } catch (e) {
      // display error UI
      console.error('sendDirect e', e)
      // TODO: setErrors([getLogFromError(e)])
      onError({ view: TransferView.Error, errors: [e] })
    }
  }

  // Non-approval flow
  const transferBasic = async (signer, senderAddr, contractPort) => {
    setShowSteps(true)
    setCurrentIbcStep(0)

    const sendMsg = await getMsgSendIcsNft({
      channel_id: selectedChannel?.channel || '',
      contract: `${contractPort}`,
      token_id: `${query.tokenId}`,
      receiver,
    })

    try {
      const res = await signer.execute(
        senderAddr,
        `${nftContractAddr}`,
        sendMsg,
        'auto',
        memo,
      );
      console.log('transferBasic res', res)
      if (res?.transactionHash) {
        txns.push({
          txHash: res?.transactionHash,
          data: res,
          type: 'send',
        })
        return loopListener(signer)
        // onSuccess({ view: TransferView.Success, txHash: res?.transactionHash })
      }
    } catch (e) {
      // display error UI
      console.error('transferBasic e', e)
      // TODO: setErrors([getLogFromError(e)])
      onError({ view: TransferView.Error, errors: [e] })
    }
  }

  // needs-approval flow
  const transferApproved = async (signer, senderAddr, proxy_addr) => {
    setRequiresApproval(true)
    setShowSteps(true)
    setCurrentIbcStep(0)

    let proxy_fee = []
    try {
      // TODO: FINISH!!! (Likely need to verify channels are whitelisted, collection is whitelisted if non-stargaze)
      const res = await signer.queryContractSmart(proxy_addr, queryICSProxyConfig())
      if (res.ics721_config?.fee) proxy_fee = [res.ics721_config.fee]
    } catch (e) {
      // no proxy fee
    }
    console.log('proxy_fee', proxy_fee)

    // TODO: Check if approval exists???

    // Need 2 messages:
    // 1. approve proxy (if available)
    // 2. submit transfer (directly or via proxy)
    const msgApproveProxy = getMsgApproveIcsProxy({ proxy_addr, token_id: `${query.tokenId}` })
    const getProxySendIcsNft = getMsgProxySendIcsNft({
      channel_id: selectedChannel?.channel || '',
      contract: `${nftContractAddr}`,
      token_id: `${query.tokenId}`,
      receiver,
    })

    try {
      const res = await signer.execute(
        senderAddr,
        `${nftContractAddr}`,
        msgApproveProxy,
        'auto',
        memo
      );
      if (res?.transactionHash) {
        txns.push({
          txHash: res?.transactionHash,
          data: res,
          type: 'approve',
        })
      }
    } catch (e) {
      console.log('approval e',e);
      
      // display error UI
      return onError({ view: TransferView.Error, errors: [e] })
    }
    setCurrentIbcStep(1)

    try {
      const res = await signer.execute(
        senderAddr,
        `${proxy_addr}`,
        getProxySendIcsNft,
        'auto',
        memo,
        proxy_fee,
      );
      if (res?.transactionHash) {
        txns.push({
          txHash: res?.transactionHash,
          data: res,
          type: 'send',
        })
        // // TODO: Verify this! might need to watch for relayer needs
        // return onSuccess({
        //   view: TransferView.Success,
        //   txns,
        // })
        setCurrentIbcStep(2)
        return loopListener(signer)
      }
    } catch (e) {
      // display error UI
      onError({ view: TransferView.Error, errors: [e] })
    }
  }

  const submitTransfer = async () => {
    if (!nftContractAddr) return onError({ view: TransferView.Error, errors: ['Collection contract not found'] })
    const { signer, senderAddr } = await getSrcSigner()

    // If its same-chain - simply send without IBC
    const recipientChain = getChainForAddress(receiver)
    if (selectedChannel?.chain_id === recipientChain?.chain_id) return sendDirect(signer, senderAddr)
    
    const isWasmPort = `${selectedChannel.port}`.search('wasm') > -1

    // non-cosmwasm
    if (!isWasmPort) return onError({ view: TransferView.Error, errors: ['Non-wasm collection not supported yet!'] })

    const contractPort = `${selectedChannel.port}`.split('.')[1]
    if (!contractPort || !receiver || !selectedChannel?.channel) return onError({ view: TransferView.Error, errors: ['IBC Channel information not found'] })

    let proxy_addr
    try {
      const res = await signer.queryContractSmart(contractPort, queryICSBridgeProxy())
      if (res) proxy_addr = res
    } catch (e) {
      // no proxy, just do basic
    }
    
    if (proxy_addr) return transferApproved(signer, senderAddr, proxy_addr)
    return transferBasic(signer, senderAddr, contractPort)
  }

  return (
    <div>
      
      {!showSteps && (
        <>
          <div className="relative mt-0 text-left sm:mt-0">
            <Dialog.Title as="div" className="text-2xl font-semibold leading-6 text-gray-100">
              Transfer

              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Move an NFT to any recipient across the interchain.
                </p>
              </div>
            </Dialog.Title>

            <button
              type="button"
              className="absolute top-0 right-0 bg-transparent opacity-70 hover:opacity-100 hover:bg-gray-800 px-4 py-3 rounded-xl"
              onClick={() => setOpen(false)}
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
                  <div className={[
                    'flex rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset',
                    receiverValid == false && receiver.length > 0 ? 'focus-within:ring-red-500' : 'focus-within:ring-green-500',
                  ]}>
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

                  {receiverValid == false && receiver.length > 2 && (
                    <p className="text-red-600 font-bold mt-2 text-sm">Invalid Address! Please fix your address or change "To" network before you can proceed</p>
                  )}
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
              <p>~45 seconds</p>
            </div>

          </div>
          <div className="mt-12 sm:mt-6 md:mt-12 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-4">
            <button
              type="button"
              className={[
                ' transition-all inline-flex w-full justify-center rounded-md px-8 py-4 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:col-start-2 ',
                receiver.length < 40 ? ' cursor-not-allowed pointer-events-none ' : ' ',
                receiverValid == true && receiver.length > 40 ? ' bg-pink-600 hover:bg-pink-600/80 focus-visible:outline-pink-600 ' : ' opacity-50 bg-gray-600 focus-visible:outline-gray-600 ',
              ].join()}
              onClick={submitTransfer}
              disabled={receiverValid == false && receiver.length > 2}
            >
              Send
              <PaperAirplaneIcon className="flex-shrink-0 w-5 h-5 ml-2 text-white" />
            </button>
          </div>
        </>
      )}

      {showSteps && (
        <TransferProgress setOpen={setOpen} imageUrl={imageUrl} currentSteps={currentSteps} />
      )}

    </div>
  )
}
