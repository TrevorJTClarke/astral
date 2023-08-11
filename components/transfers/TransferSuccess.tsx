/* eslint-disable @next/next/no-img-element */
import { useRouter } from 'next/router';
import { Dialog } from '@headlessui/react'
import {
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import NftImage from '../nft-image'

export interface TransferSuccessType {
  imageUrl?: string
  nextUrlHref?: string
}

export default function TransferSuccess({
  imageUrl,
  nextUrlHref,
}: TransferSuccessType) {
  const router = useRouter()

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
  )
}
