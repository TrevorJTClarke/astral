/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router';
import { Dialog } from '@headlessui/react'
import type { Dispatch } from './TransferModal'
import {
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import NftImage from '../nft-image'
import { getExplorerFromTxData, getExplorerUrlForTx } from '../../config'
import React from 'react';

export interface TransferSuccessType {
  setOpen: Dispatch<boolean>
  imageUrl?: string
  data?: any
}

export default function TransferSuccess({
  setOpen,
  imageUrl,
  data,
}: TransferSuccessType) {
  const router = useRouter()

  // route to finished page
  const navigateToNft = async () => {
    setOpen(false)
    if (data.type === 'direct') return
    if (data.nextUrl) return router.push(data.nextUrl)
    // fallback
    router.replace(`/my-nfts`)
  }

  const getExplorerUrl = (tx) => {
    const explorer = getExplorerFromTxData(tx.data)
    if (!explorer) return;
    return getExplorerUrlForTx(explorer.tx_page, tx.txHash)
  }

  const { txns } = data

  return (
    <div className="flex flex-col relative mt-0 text-center sm:mt-0">
      <Dialog.Title as="div" className="text-2xl font-semibold leading-6 text-gray-100">
        🎉 Success! 🎉

        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Your transfer has finished. Time for confetti!
          </p>
        </div>
      </Dialog.Title>

      <div className="flex justify-start gap-16 relative mx-auto mt-8">
        <NftImage className="min-h-[250px] min-w-[250px]" uri={imageUrl || ''} />

        {txns && txns.length > 0 && (
          <div className="my-auto">
            <ul role="list" className="overflow-hidden text-gray-300 text-left">
              {txns.map((tx, idx) => (
                <li key={idx} className="group mb-8">
                  <p className="inline gap-2">
                    {tx.type === 'approve' && (
                      <span>{idx + 1}. Approval to Send NFT completed.</span>
                    )}
                    {tx.type === 'send' && (
                      <span>{idx + 1}. Send NFT over IBC completed.</span>
                    )}
                    {tx.type === 'direct' && (
                      <span>{idx + 1}. Send NFT completed.</span>
                    )}
                    <br /><a className="text-sm text-pink-300 group-hover:text-pink-700 underline" title={tx.txHash} href={getExplorerUrl(tx)}>View transaction receipt 👉</a>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
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
  )
}
