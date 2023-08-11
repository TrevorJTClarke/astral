/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { Chain } from '@chain-registry/types';
import type { Dispatch } from './TransferModal'
import { CosmWasmSigner, Link } from '@confio/relayer';
import { OfflineSigner } from "@cosmjs/proto-signing";
import { Dialog } from '@headlessui/react'
import { useManager } from '@cosmos-kit/react';
import { NFTChannel, } from '../../contexts/connections'
import { getLinkForChannel } from '../../contexts/ibc';
import { classNames, } from '../../config'
import NftImage from '../nft-image'
import {
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline'

export interface TransferSelfRelayTypes {
  setOpen: Dispatch <boolean>
  onSuccess: Dispatch <any>
  onError: Dispatch <any>
  imageUrl?: string
  srcNetwork?: Chain
  destNetwork?: Chain
  selectedChannel?: NFTChannel
}

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
// OLD:
// const allRelayerSteps = [
//   { name: 'Initialize Proof', href: '#', status: 'current', description: 'Source network submits proof to destination' },
//   { name: 'Acknowledge Proof', href: '#', status: 'upcoming', description: 'Destination network confirms proof' },
//   { name: 'Confirm Transfer', href: '#', status: 'upcoming', description: 'Source network confirms transfer complete' },
// ]
// NEW:
const allRelayerSteps = [
  { name: 'Approve Send', href: '#', status: 'current', description: 'Source network approves transfer to destination' },
  { name: 'Transfer', href: '#', status: 'upcoming', description: 'Destination network confirms & completes transfer' },
  { name: 'Confirm Transfer', href: '#', status: 'upcoming', description: 'Source network confirms transfer complete' },
]

export default function TransferSelfRelay({
  setOpen,
  onSuccess,
  onError,
  imageUrl,
  srcNetwork,
  destNetwork,
  selectedChannel,
}: TransferSelfRelayTypes) {
  // const [srcNetwork, setSrcNetwork] = useState<Chain | undefined>()
  // const [destNetwork, setDestNetwork] = useState<Chain | undefined>()
  // const [selectedChannel, setSelectedChannel] = useState<NFTChannel | undefined>()
  // const [currentView, setCurrentView] = useState<TransferView>(TransferView.Setup);
  // const [currentIbcStep, setCurrentIbcStep] = useState(0);

  // self-relay
  const [link, setLink] = useState<Link | undefined>();
  const [relayRunning, setRelayRunning] = useState<boolean>(false);
  const [relayerSteps, setRelayerSteps] = useState(allRelayerSteps);
  const [currentRelayerStep, setCurrentRelayerStep] = useState(0);

  // dynamic wallet/client connections
  const manager = useManager()

  // self-relayer logic ---------
  async function relayerLoop() {
    if (!link) return;
    try {
      // Relay ONCE
      if (link?.relayAll) {
        // await link.relayAll()
        link.relayAll().then(() => {
          // setCurrentView(TransferView.Complete)
          // setCurrentIbcStep(1)
          onSuccess()
        })
      }
    } catch (e) {
      console.error(`Caught error: `, e);
      // setCurrentView(TransferView.Error)
      onError(e)
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
            // setCurrentView(TransferView.Complete)
            // setCurrentIbcStep(1)
            onSuccess()
          }, 2000)
          break;
        }

      } catch (e) {
        console.error(`Caught error: `, e);
        onError(e)
      }
      await sleep(poll)
    }
  }

  const startSelfRelay = async () => {
    try {
      setCurrentRelayerStep(1)
      if (!srcNetwork?.chain_name) {
        // setCurrentView(TransferView.Error)
        onError('no_src_chain')
        return;
      }
      const repoA = manager.getWalletRepo(srcNetwork?.chain_name)
      console.log('repoA', srcNetwork?.chain_name, repoA)
      // if (repoA.isWalletDisconnected) await repoA.connect(repoA.wallets[0].walletName, true)
      await repoA.connect(repoA.wallets[0].walletName, true)
      const aSignerWallet = await repoA.getWallet(repoA.wallets[0].walletName)
      if (!aSignerWallet) {
        // setCurrentView(TransferView.Error)
        onError('no_signer_wallet')
        return;
      }
      const aSigner = await aSignerWallet.getSigningCosmWasmClient()
      const aSignerClient: CosmWasmSigner = {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        sign: aSigner,
        senderAddress: repoA.current?.address || '',
      }
      console.log('getOfflineSigner', srcNetwork?.chain_id)
      const aOfflineClient: OfflineSigner = aSignerWallet.offlineSigner.keplr.getOfflineSigner(srcNetwork?.chain_id, 'direct')
      console.log('aOfflineClient', aOfflineClient)

      const repoB = manager.getWalletRepo(destNetwork?.chain_name)
      console.log('repoB', destNetwork?.chain_name, repoB)
      // if (repoB.isWalletDisconnected) await repoB.connect(repoB.wallets[0].walletName, true)
      await repoB.connect(repoB.wallets[0].walletName, true)
      const bSignerWallet = await repoB.getWallet(repoB.wallets[0].walletName, true)
      const bSigner = await bSignerWallet.getSigningCosmWasmClient()
      const bSignerClient: CosmWasmSigner = {
        sign: bSigner,
        senderAddress: repoB.current?.address || '',
      }
      console.log('getOfflineSigner', destNetwork?.chain_id)
      const bOfflineClient: OfflineSigner = bSignerWallet.offlineSigner.keplr.getOfflineSigner(destNetwork?.chain_id, 'direct')
      console.log('aOfflineClient', aOfflineClient)

      // Get link, before relayer loop
      const linkInst = await getLinkForChannel(
        aSignerClient,
        aOfflineClient,
        bSignerClient,
        bOfflineClient,
        selectedChannel?.port,
        selectedChannel?.channel,
      )
      console.log('linkInst', linkInst)

      setLink(linkInst)
      setRelayRunning(true)
    } catch (e) {
      console.error(e)
      setLink(undefined)
      setRelayRunning(false)
      // setCurrentView(TransferView.Error)
      onError(e)
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
          disabled={currentRelayerStep !== 0}
        >
          Cancel
        </button>
      </div>

    </div>
  )
}
